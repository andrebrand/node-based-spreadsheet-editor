import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'

export interface PipelineData {
  fileName: string
  headers: string[]
  rows: Record<string, any>[]
}

export const rawData = ref<PipelineData>({
  fileName: '',
  headers: [],
  rows: []
})

export const nodes = ref<Node<any>[]>([])
export const edges = ref<Edge[]>([])
export const previewSource = ref<'input' | 'output'>('output')

// Evaluator: Calculates the output table from the connections
export const outputTable = computed(() => {
  if (!rawData.value.rows.length) return { headers: [], rows: [] }

  const nodeList = nodes.value as Node<any>[]
  const outputNode = nodeList.find((n) => n.type === 'output')
  if (!outputNode) return { headers: [], rows: [] }

  const targetColumns: string[] = outputNode.data?.columns || []
  const resultRows: Record<string, any>[] = rawData.value.rows.map(() => ({}))
  type EvaluationContext = {
    nodeList: Node<any>[]
    edgeList: Edge[]
    externalInputs?: Map<string, any[]>
  }
  const rootContext: EvaluationContext = {
    nodeList,
    edgeList: edges.value as Edge[]
  }

  // Helper: Gets the data stream for a specific input handle
  function getStreamForHandle(nodeId: string, handleId: string, context = rootContext): any[] {
    // Find the incoming connection
    const edge = context.edgeList.find((e) => e.target === nodeId && e.targetHandle === handleId)
    if (!edge) return context.externalInputs?.get(`${nodeId}:${handleId}`) || rawData.value.rows.map(() => '')

    const sourceNode = context.nodeList.find((n) => n.id === edge.source)
    if (!sourceNode) return rawData.value.rows.map(() => '')

    // 1. Input Node: Provides the column data directly
    if (sourceNode.type === 'input') {
      const colName = edge.sourceHandle ?? ''
      return rawData.value.rows.map((r) => r[colName] ?? '')
    }

    // String Node: Provides the same fixed value for every data row
    if (sourceNode.type === 'string') {
      const value = sourceNode.data?.value ?? ''
      return rawData.value.rows.map(() => value)
    }

    // Counter Node: Generates a sequential string value for each row
    if (sourceNode.type === 'counter') {
      const step = Number(sourceNode.data?.step ?? 1)
      const increment = Number.isFinite(step) ? step : 1
      let startValues = rawData.value.rows.map(() => Number(sourceNode.data?.startValue ?? 0))

      if (sourceNode.data?.startMode === 'input') {
        const inputValues = getStreamForHandle(sourceNode.id, 'start', context)
        startValues = inputValues.map((value) => {
          const parsed = Number(value)
          return Number.isFinite(parsed) ? parsed : 0
        })
      }

      return startValues.map((startValue, index) => String(startValue + index * increment))
    }

    // Unique Count Node: Increments when an input combination is unique and has not appeared before
    if (sourceNode.type === 'uniqueCountNode' || sourceNode.type === 'uniqueCount') {
      const step = Number(sourceNode.data?.step ?? 1)
      const increment = Number.isFinite(step) ? step : 1
      const mode = sourceNode.data?.mode || 'id'

      let startBase = Number(sourceNode.data?.startValue ?? 1)
      if (!Number.isFinite(startBase)) startBase = 1

      if (sourceNode.data?.startMode === 'input') {
        const inputValues = getStreamForHandle(sourceNode.id, 'start', context)
        const firstParsed = Number(inputValues[0])
        startBase = Number.isFinite(firstParsed) ? firstParsed : 1
      }

      const inputCount = Math.max(1, Number(sourceNode.data?.inputCount || 1))
      const inputStreams = Array.from({ length: inputCount }, (_, index) => (
        getStreamForHandle(sourceNode.id, `input-${index}`, context)
      ))

      const seenMap = new Map<string, number>()
      let uniqueIndex = 0
      let lastAssigned = startBase

      return rawData.value.rows.map((_, rowIndex) => {
        const combo = inputStreams.map((stream) => String(stream[rowIndex] ?? ''))
        const key = JSON.stringify(combo)

        if (seenMap.has(key)) {
          if (mode === 'running') {
            return String(lastAssigned)
          }
          return String(seenMap.get(key))
        }

        const assignedValue = startBase + uniqueIndex * increment
        seenMap.set(key, assignedValue)
        lastAssigned = assignedValue
        uniqueIndex += 1

        return String(assignedValue)
      })
    }

    // Coalesce Node: Returns the first non-empty string value for each row
    if (sourceNode.type === 'coalesce') {
      const inputCount = sourceNode.data?.inputCount || 0
      const inputStreams = Array.from({ length: inputCount }, (_, index) => (
        getStreamForHandle(sourceNode.id, `input-${index}`, context)
      ))

      return rawData.value.rows.map((_, rowIndex) => {
        for (const stream of inputStreams) {
          const value = stream[rowIndex]
          if (value !== '' && value !== undefined && value !== null) return String(value)
        }
        return ''
      })
    }

    // Compare Node: Compares two string streams and returns true or false
    if (sourceNode.type === 'compare') {
      const leftStream = getStreamForHandle(sourceNode.id, 'leftString', context)
      const rightStream = getStreamForHandle(sourceNode.id, 'rightString', context)
      const operator = sourceNode.data?.operator || 'equals'

      return rawData.value.rows.map((_, rowIndex) => {
        const left = String(leftStream[rowIndex] ?? '')
        const right = String(rightStream[rowIndex] ?? '')
        let result = false

        if (operator === 'not-equals') result = left !== right
        if (operator === 'contains') result = left.includes(right)
        if (operator === 'starts-with') result = left.startsWith(right)
        if (operator === 'ends-with') result = left.endsWith(right)
        if (operator === 'equals') result = left === right

        return String(result)
      })
    }

    // If Node: Returns the Then or Else value for each row
    if (sourceNode.type === 'if') {
      const conditionStream = getStreamForHandle(sourceNode.id, 'condition', context)
      const thenStream = getStreamForHandle(sourceNode.id, 'then', context)
      const elseStream = getStreamForHandle(sourceNode.id, 'else', context)

      return rawData.value.rows.map((_, rowIndex) => {
        const condition = conditionStream[rowIndex]
        const isTrue = typeof condition === 'boolean'
          ? condition
          : String(condition ?? '').trim().toLowerCase() === 'true'
            ? true
            : String(condition ?? '').trim().toLowerCase() === 'false'
              ? false
              : Boolean(condition)

        return String(isTrue ? thenStream[rowIndex] ?? '' : elseStream[rowIndex] ?? '')
      })
    }

    if (sourceNode.type === 'preset') {
      const preset = sourceNode.data?.preset
      if (!preset) return rawData.value.rows.map(() => '')

      const virtualGroup = {
        id: preset.originalGroupId,
        type: 'group',
        data: JSON.parse(JSON.stringify(preset.group?.data || {}))
      } as Node<any>
      const embeddedContext: EvaluationContext = {
        nodeList: [virtualGroup, ...preset.childNodes],
        edgeList: preset.edges || [],
        externalInputs: new Map(
          (virtualGroup.data?.inputs || []).map((port: any) => [
            `${virtualGroup.id}:${port.id}`,
            getStreamForHandle(sourceNode.id, port.id, context)
          ])
        )
      }
      const outputPort = (virtualGroup.data?.outputs || []).find((port: any) => port.id === edge.sourceHandle)
      const internalOutput = outputPort?.internalId || 'internal-output'
      return getStreamForHandle(virtualGroup.id, internalOutput, embeddedContext)
    }

    // Group Node: Passes values between external and internal ports
    if (sourceNode.type === 'group') {
      const sHandle = edge.sourceHandle || ''

      // 1. Edge source is an internal-input (inner nodes consuming from group input)
      if (sHandle === 'internal-input') {
        return getStreamForHandle(sourceNode.id, 'input', context)
      }
      if (sHandle.startsWith('internal-input-')) {
        const suffix = sHandle.slice('internal-input-'.length)
        return getStreamForHandle(sourceNode.id, `input-${suffix}`, context)
      }
      const matchingInput = sourceNode.data?.inputs?.find?.((p: any) => p.internalId === sHandle)
      if (matchingInput) {
        return getStreamForHandle(sourceNode.id, matchingInput.id, context)
      }

      // 2. Edge source is an outer output (external nodes consuming group result)
      const matchingOutput = sourceNode.data?.outputs?.find?.((p: any) => p.id === sHandle)
      const targetInternalHandle = matchingOutput?.internalId || (
        sHandle === 'output'
          ? 'internal-output'
          : (sHandle.startsWith('output-')
              ? `internal-output-${sHandle.slice('output-'.length)}`
              : 'internal-output')
      )

      const internalOutputEdge = context.edgeList.find((candidate) => (
        candidate.target === sourceNode.id && candidate.targetHandle === targetInternalHandle
      ))
      if (internalOutputEdge) return getStreamForHandle(sourceNode.id, targetInternalHandle, context)

      // No internal connection for this output — return empty values
      return rawData.value.rows.map(() => '')
    }

    // Combine Strings Node: Joins two values per row with a separator
    if (sourceNode.type === 'combine') {
      const string1 = getStreamForHandle(sourceNode.id, 'string1', context)
      const string2 = getStreamForHandle(sourceNode.id, 'string2', context)
      const separator = getStreamForHandle(sourceNode.id, 'separator', context)

      return rawData.value.rows.map((_, index) => (
        `${String(string1[index] ?? '')}${String(separator[index] ?? '')}${String(string2[index] ?? '')}`
      ))
    }

    // Join Node: Collects any number of string streams into an array per row
    if (sourceNode.type === 'join') {
      const inputCount = sourceNode.data?.inputCount || 0
      const inputStreams = Array.from({ length: inputCount }, (_, index) => (
        getStreamForHandle(sourceNode.id, `input-${index}`, context)
      ))

      return rawData.value.rows.map((_, rowIndex) => (
        inputStreams.map((stream) => String(stream[rowIndex] ?? ''))
      ))
    }

    // Split Node: Returns one array element as a string stream
    if (sourceNode.type === 'split') {
      const inputStream = getStreamForHandle(sourceNode.id, 'input', context)
      const outputIndex = Number((edge.sourceHandle ?? '').replace('output-', ''))

      return inputStream.map((value) => {
        if (!Array.isArray(value)) return ''
        return String(value[outputIndex] ?? '')
      })
    }

    // Split String Node: splits one string stream into one stream per output port.
    if (sourceNode.type === 'splitString') {
      const inputStream = getStreamForHandle(sourceNode.id, 'input', context)
      const separatorStream = getStreamForHandle(sourceNode.id, 'separator', context)
      const outputIndex = Number((edge.sourceHandle ?? '').replace('output-', ''))

      return inputStream.map((value, rowIndex) => {
        const separator = String(separatorStream[rowIndex] ?? '')
        const parts = separator ? String(value ?? '').split(separator) : [String(value ?? '')]
        return parts[outputIndex] ?? ''
      })
    }

    // 2. Regex Node: Transforms the input
    if (sourceNode.type === 'regex') {
      const inputStream = getStreamForHandle(sourceNode.id, 'input', context)
      const pattern = sourceNode.data?.pattern || ''
      const flags = sourceNode.data?.flags || ''
      const mode = sourceNode.data?.mode || 'match' // 'match' oder 'replace'
      const replacement = sourceNode.data?.replacement || ''

      return inputStream.map((val) => {
        const strVal = String(val)
        if (!pattern) return strVal
        try {
          const regex = new RegExp(pattern, flags)
          if (mode === 'replace') {
            return strVal.replace(regex, replacement)
          } else {
            const match = strVal.match(regex)
            return match ? match[0] : ''
          }
        } catch {
          return strVal
        }
      })
    }

    return rawData.value.rows.map(() => '')
  }

  // Populate the output node columns
  targetColumns.forEach((colName) => {
    const stream = getStreamForHandle(outputNode.id, `target-${colName}`)
    stream.forEach((val, idx) => {
      resultRows[idx][colName] = val
    })
  })

  return {
    headers: targetColumns,
    rows: resultRows
  }
})