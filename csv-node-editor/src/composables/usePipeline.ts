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

// Evaluator: Berechnet die Ausgabetabelle anhand der Verbindungen
export const outputTable = computed(() => {
  if (!rawData.value.rows.length) return { headers: [], rows: [] }

  const nodeList = nodes.value as Node<any>[]
  const outputNode = nodeList.find((n) => n.type === 'output')
  if (!outputNode) return { headers: [], rows: [] }

  const targetColumns: string[] = outputNode.data?.columns || []
  const resultRows: Record<string, any>[] = rawData.value.rows.map(() => ({}))

  // Hilfsfunktion: Ermittelt den Datenstrom für ein bestimmtes Input-Handle
  function getStreamForHandle(nodeId: string, handleId: string): any[] {
    // Finde eingehende Verbindung
    const edgeList = edges.value as Edge[]
    const edge = edgeList.find((e) => e.target === nodeId && e.targetHandle === handleId)
    if (!edge) return rawData.value.rows.map(() => '')

    const sourceNode = nodeList.find((n) => n.id === edge.source)
    if (!sourceNode) return rawData.value.rows.map(() => '')

    // 1. Input Node: Liefert direkt die Spaltendaten
    if (sourceNode.type === 'input') {
      const colName = edge.sourceHandle ?? ''
      return rawData.value.rows.map((r) => r[colName] ?? '')
    }

    // String Node: Liefert denselben festen Wert für jede Datenzeile
    if (sourceNode.type === 'string') {
      const value = sourceNode.data?.value ?? ''
      return rawData.value.rows.map(() => value)
    }

    // Combine Strings Node: Verbindet zwei Werte pro Zeile mit einem Separator
    if (sourceNode.type === 'combine') {
      const string1 = getStreamForHandle(sourceNode.id, 'string1')
      const string2 = getStreamForHandle(sourceNode.id, 'string2')
      const separator = getStreamForHandle(sourceNode.id, 'separator')

      return rawData.value.rows.map((_, index) => (
        `${String(string1[index] ?? '')}${String(separator[index] ?? '')}${String(string2[index] ?? '')}`
      ))
    }

    // Join Node: Sammelt beliebig viele String-Streams zu einem Array pro Zeile
    if (sourceNode.type === 'join') {
      const inputCount = sourceNode.data?.inputCount || 0
      const inputStreams = Array.from({ length: inputCount }, (_, index) => (
        getStreamForHandle(sourceNode.id, `input-${index}`)
      ))

      return rawData.value.rows.map((_, rowIndex) => (
        inputStreams.map((stream) => String(stream[rowIndex] ?? ''))
      ))
    }

    // Split Node: Gibt ein Array-Element als String-Stream aus
    if (sourceNode.type === 'split') {
      const inputStream = getStreamForHandle(sourceNode.id, 'input')
      const outputIndex = Number((edge.sourceHandle ?? '').replace('output-', ''))

      return inputStream.map((value) => {
        if (!Array.isArray(value)) return ''
        return String(value[outputIndex] ?? '')
      })
    }

    // 2. Regex Node: Transformiert die Eingabe
    if (sourceNode.type === 'regex') {
      const inputStream = getStreamForHandle(sourceNode.id, 'input')
      const pattern = sourceNode.data?.pattern || ''
      const flags = sourceNode.data?.flags || 'g'
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

  // Befülle die Spalten des Output-Knotens
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