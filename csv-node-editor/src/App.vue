<template>
  <div class="app-layout">
    <header class="app-header">
      <h2>CSV/Excel Node Editor</h2>
      <input ref="fileInput" type="file" accept=".csv, .xlsx, .xls" @change="handleFileUpload" />
      <div class="save-btn-wrapper">
        <button class="save-plan-btn" type="button" @click="savePlan">💾 Save working file</button>
        <button class="load-plan-btn" type="button" @click="planFileInput?.click()">📁 Load working file</button>
      </div>
      <input ref="planFileInput" class="hidden-file-input" type="file" accept=".json" @change="handlePlanLoad" />
    </header>

    <div
      ref="mainContentRef"
      class="main-content"
      :class="['position-' + previewPosition, { 'is-resizing': isResizing }]"
    >
      <div class="editor-pane">
        <NodeEditor :flow-key="flowKey" :on-input-delete="resetApp" />
      </div>
      <div
        class="pane-resizer nodrag"
        :class="['resizer-' + previewPosition, { 'is-dragging': isResizing }]"
        role="separator"
        :aria-orientation="previewPosition === 'right' ? 'vertical' : 'horizontal'"
        tabindex="0"
        :title="previewPosition === 'right'
          ? 'Breite der Vorschau anpassen (Doppelklick zum Zurücksetzen)'
          : 'Höhe der Vorschau anpassen (Doppelklick zum Zurücksetzen)'"
        @pointerdown="startResize"
        @dblclick="resetPreviewSize"
        @keydown.left.prevent="previewPosition === 'right' && stepResize(20)"
        @keydown.right.prevent="previewPosition === 'right' && stepResize(-20)"
        @keydown.up.prevent="previewPosition === 'bottom' && stepResize(20)"
        @keydown.down.prevent="previewPosition === 'bottom' && stepResize(-20)"
      >
        <div class="resizer-handle"></div>
      </div>
      <div class="preview-pane" :style="previewPaneStyle">
        <TablePreview
          :position="previewPosition"
          @toggle-position="togglePreviewPosition"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import NodeEditor from './components/NodeEditor.vue'
import TablePreview from './components/TablePreview.vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Edge, Node } from '@vue-flow/core'
import { rawData, nodes, edges } from './composables/usePipeline'
import { getNodePortName, isTargetHandle, normalizeTargetHandle } from './composables/usePortNames'

const fileInput = ref<HTMLInputElement | null>(null)
const planFileInput = ref<HTMLInputElement | null>(null)
const flowKey = ref(0)

const mainContentRef = ref<HTMLDivElement | null>(null)
const previewPosition = ref<'right' | 'bottom'>(
  (typeof window !== 'undefined' && (localStorage.getItem('csv_editor_preview_position') as any)) || 'right'
)

const defaultPreviewWidth = 650
const defaultPreviewHeight = 400

const savedWidth = typeof window !== 'undefined' ? localStorage.getItem('csv_editor_preview_pane_width') : null
const savedHeight = typeof window !== 'undefined' ? localStorage.getItem('csv_editor_preview_pane_height') : null

const previewWidth = ref<number>(savedWidth ? Math.max(240, parseFloat(savedWidth)) : defaultPreviewWidth)
const previewHeight = ref<number>(savedHeight ? Math.max(140, parseFloat(savedHeight)) : defaultPreviewHeight)
const isResizing = ref(false)

watch(
  () => rawData.value.fileName,
  (fileName) => {
    document.title = fileName ? `csv-node-editor - ${fileName}` : 'csv-node-editor'
  },
  { immediate: true }
)

watch(
  () => nodes.value.some((node) => node.id === 'node_input'),
  (hasInput, hadInput) => {
    if (hadInput && !hasInput) resetApp()
  }
)

const previewPaneStyle = computed(() => {
  if (previewPosition.value === 'bottom') {
    return {
      height: `${previewHeight.value}px`,
      width: '100%',
      flex: 'none'
    }
  }
  return {
    width: `${previewWidth.value}px`,
    height: '100%',
    flex: 'none'
  }
})

function togglePreviewPosition() {
  previewPosition.value = previewPosition.value === 'right' ? 'bottom' : 'right'
  localStorage.setItem('csv_editor_preview_position', previewPosition.value)
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 50)
}

function startResize(event: PointerEvent) {
  event.preventDefault()
  isResizing.value = true

  const startX = event.clientX
  const startY = event.clientY
  const startWidth = previewWidth.value
  const startHeight = previewHeight.value
  const isRight = previewPosition.value === 'right'

  const onPointerMove = (e: PointerEvent) => {
    if (!isResizing.value) return

    if (isRight) {
      const deltaX = startX - e.clientX
      const containerWidth = mainContentRef.value?.clientWidth || window.innerWidth
      const minWidth = 240
      const maxWidth = Math.max(minWidth, containerWidth - 300)
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX))
      previewWidth.value = Math.round(nextWidth)
    } else {
      const deltaY = startY - e.clientY
      const containerHeight = mainContentRef.value?.clientHeight || window.innerHeight
      const minHeight = 140
      const maxHeight = Math.max(minHeight, containerHeight - 200)
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY))
      previewHeight.value = Math.round(nextHeight)
    }
  }

  const onPointerUp = () => {
    isResizing.value = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)

    if (isRight) {
      localStorage.setItem('csv_editor_preview_pane_width', String(previewWidth.value))
    } else {
      localStorage.setItem('csv_editor_preview_pane_height', String(previewHeight.value))
    }
    window.dispatchEvent(new Event('resize'))
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function resetPreviewSize() {
  if (previewPosition.value === 'right') {
    previewWidth.value = defaultPreviewWidth
    localStorage.setItem('csv_editor_preview_pane_width', String(defaultPreviewWidth))
  } else {
    previewHeight.value = defaultPreviewHeight
    localStorage.setItem('csv_editor_preview_pane_height', String(defaultPreviewHeight))
  }
  window.dispatchEvent(new Event('resize'))
}

function stepResize(delta: number) {
  if (previewPosition.value === 'right') {
    const containerWidth = mainContentRef.value?.clientWidth || window.innerWidth
    const minWidth = 240
    const maxWidth = Math.max(minWidth, containerWidth - 300)
    previewWidth.value = Math.min(maxWidth, Math.max(minWidth, previewWidth.value + delta))
    localStorage.setItem('csv_editor_preview_pane_width', String(previewWidth.value))
  } else {
    const containerHeight = mainContentRef.value?.clientHeight || window.innerHeight
    const minHeight = 140
    const maxHeight = Math.max(minHeight, containerHeight - 200)
    previewHeight.value = Math.min(maxHeight, Math.max(minHeight, previewHeight.value + delta))
    localStorage.setItem('csv_editor_preview_pane_height', String(previewHeight.value))
  }
  window.dispatchEvent(new Event('resize'))
}

function handleWindowResize() {
  if (!mainContentRef.value) return
  if (previewPosition.value === 'right') {
    const containerWidth = mainContentRef.value.clientWidth || window.innerWidth
    const maxWidth = Math.max(240, containerWidth - 300)
    if (previewWidth.value > maxWidth) {
      previewWidth.value = maxWidth
    }
  } else {
    const containerHeight = mainContentRef.value.clientHeight || window.innerHeight
    const maxHeight = Math.max(140, containerHeight - 200)
    if (previewHeight.value > maxHeight) {
      previewHeight.value = maxHeight
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})

function resetApp() {
  rawData.value = {
    fileName: '',
    headers: [],
    rows: []
  }
  nextTick(() => {
    const removedNodeIds = new Set(['node_input', 'node_output'])
    nodes.value = nodes.value.filter((node) => !removedNodeIds.has(node.id))
    edges.value = edges.value.filter((edge) => (
      !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
    ))
    flowKey.value += 1
  })
  if (fileInput.value) fileInput.value.value = ''
  if (planFileInput.value) planFileInput.value.value = ''
}

function savePlan() {
  const plan = {
    version: 1,
    fileName: rawData.value.fileName,
    headers: rawData.value.headers,
    rows: rawData.value.rows,
    nodes: nodes.value,
    edges: edges.value
  }
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${rawData.value.fileName.replace(/\.[^.]+$/, '') || 'csv-node-plan'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function handlePlanLoad(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const plan = JSON.parse(String(reader.result))
      if (!Array.isArray(plan.nodes) || !Array.isArray(plan.edges) || !Array.isArray(plan.headers)) {
        throw new Error('Ungültiges Planformat')
      }

      const loadedNodes = (plan.nodes as Node<any>[]).map((node) => {
        if (node.id !== 'node_input') return node
        return {
          ...node,
          data: { ...node.data, onDelete: resetApp }
        }
      })

      rawData.value = {
        fileName: typeof plan.fileName === 'string' ? plan.fileName : '',
        headers: plan.headers,
        rows: Array.isArray(plan.rows) ? plan.rows : []
      }
      edges.value = plan.edges as Edge[]
      nodes.value = loadedNodes
      flowKey.value += 1
    } catch {
      window.alert('Der Plan konnte nicht geladen werden.')
    }
  }
  reader.readAsText(file)
}

function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
    const headers = json.length > 0 ? Object.keys(json[0]) : []

    updateFileGraph(file.name, headers, json)
  }
  reader.readAsArrayBuffer(file)
}

function updateFileGraph(fileName: string, headers: string[], rows: any[]) {
  const nodeList = nodes.value as Node<any>[]
  const inputNode = nodeList.find((node) => node.id === 'node_input')
  const outputNode = nodeList.find((node) => node.id === 'node_output')
  const isNewGraph = !inputNode && !outputNode
  const outputColumns = !isNewGraph && outputNode?.data?.pinned && outputNode.data.columns?.length > 0
    ? [...outputNode.data.columns]
    : [...headers]
  const headerSet = new Set(headers)
  const validEdges: Edge[] = []
  const connectedTargets = new Set<string>()

  // Partition existing edges so non-input-source edges are evaluated first.
  // This ensures intermediate transform nodes connected to output columns take precedence over direct input passthrough.
  const existingEdges = (edges.value as Edge[]) || []
  const nonInputEdges = existingEdges.filter((e) => e.source !== 'node_input')
  const inputEdges = existingEdges.filter((e) => e.source === 'node_input')

  // 1. Process non-input edges (e.g. intermediate transform nodes -> output, or between transforms)
  nonInputEdges.forEach((edge) => {
    const targetIsOutput = edge.target === 'node_output'
    const targetNode = nodeList.find((n) => n.id === edge.target)
    const sourceNode = nodeList.find((n) => n.id === edge.source)
    if (!sourceNode || !targetNode) return

    const normTargetHandle = normalizeTargetHandle(targetNode.type, edge.targetHandle)
    const targetKey = `${edge.target}-${normTargetHandle}`

    if (targetIsOutput) {
      const targetCol = (normTargetHandle || '').startsWith('target-')
        ? (normTargetHandle || '').slice('target-'.length)
        : ''

      const targetStillExists = outputColumns.includes(targetCol)
      if (targetStillExists && !connectedTargets.has(targetKey)) {
        validEdges.push({
          ...edge,
          targetHandle: normTargetHandle || edge.targetHandle
        })
        connectedTargets.add(targetKey)
      }
    } else {
      if (!connectedTargets.has(targetKey)) {
        validEdges.push({
          ...edge,
          targetHandle: normTargetHandle || edge.targetHandle
        })
        connectedTargets.add(targetKey)
      }
    }
  })

  // 2. Process input-source edges
  inputEdges.forEach((edge) => {
    const targetNode = nodeList.find((n) => n.id === edge.target)
    if (!targetNode) return

    const normTargetHandle = normalizeTargetHandle(targetNode.type, edge.targetHandle)
    const targetKey = `${edge.target}-${normTargetHandle}`

    // If target handle already has an incoming edge, avoid duplicate connection
    if (connectedTargets.has(targetKey)) {
      return
    }

    const targetPortName = getNodePortName(targetNode, normTargetHandle, 'target')
    const oldSourceHandle = edge.sourceHandle ?? ''
    const oldSourcePortName = getNodePortName(inputNode, oldSourceHandle, 'source')

    let matchedHeader: string | null = null
    if (headerSet.has(targetPortName)) {
      matchedHeader = targetPortName
    } else if (headerSet.has(oldSourcePortName)) {
      matchedHeader = oldSourcePortName
    } else if (headerSet.has(oldSourceHandle)) {
      matchedHeader = oldSourceHandle
    }

    if (matchedHeader) {
      const edgeId = `edge-input-${matchedHeader}-${edge.target}-${normTargetHandle}`
      const nextTargetHandle = edge.target === 'node_output' && !outputNode?.data?.pinned
        ? `target-${matchedHeader}`
        : normTargetHandle || edge.targetHandle
      validEdges.push({
        ...edge,
        id: edgeId,
        sourceHandle: matchedHeader,
        targetHandle: nextTargetHandle
      })
      connectedTargets.add(`${edge.target}-${nextTargetHandle}`)
    }
  })

  // 3. Auto-connect any explicitly named ports that match a column in the new file and don't have a connection yet
  nodeList.forEach((node) => {
    if (node.id === 'node_input' || node.id === 'node_output') return
    if (node.data?.portNames) {
      Object.entries(node.data.portNames).forEach(([handleId, customName]) => {
        // Only target handles can be connected from input
        if (!isTargetHandle(node.type, handleId)) return

        const normHandleId = normalizeTargetHandle(node.type, handleId)
        const nameStr = String(customName).trim()
        if (headerSet.has(nameStr)) {
          const targetKey = `${node.id}-${normHandleId}`
          if (!connectedTargets.has(targetKey)) {
            validEdges.push({
              id: `edge-input-${nameStr}-${node.id}-${normHandleId}`,
              source: 'node_input',
              target: node.id,
              sourceHandle: nameStr,
              targetHandle: normHandleId
            })
            connectedTargets.add(targetKey)
          }
        }
      })
    }
  })

  // 4. Keep the input and output nodes connected by each current output column.
  if (isNewGraph || !outputNode?.data?.pinned) {
    outputColumns.forEach((header) => {
      const targetHandle = `target-${header}`
      const targetKey = `node_output-${targetHandle}`
      if (!connectedTargets.has(targetKey)) {
        validEdges.push({
          id: `edge-input-${header}-output-${header}`,
          source: 'node_input',
          target: 'node_output',
          sourceHandle: header,
          targetHandle
        })
        connectedTargets.add(targetKey)
      }
    })
  }

  // 5. Strict deduplication pass to ensure single edge per target handle and signature
  const seenTargets = new Set<string>()
  const seenSignatures = new Set<string>()
  const finalEdges: Edge[] = []

  validEdges.forEach((edge) => {
    const targetNode = nodeList.find((n) => n.id === edge.target)
    const normTargetHandle = normalizeTargetHandle(targetNode?.type, edge.targetHandle)
    const targetKey = `${edge.target}-${normTargetHandle}`
    const sigKey = `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${normTargetHandle}`

    if (seenTargets.has(targetKey) || seenSignatures.has(sigKey)) {
      return
    }
    seenTargets.add(targetKey)
    seenSignatures.add(sigKey)
    finalEdges.push({
      ...edge,
      targetHandle: normTargetHandle || edge.targetHandle
    })
  })

  const nextNodes = nodeList.filter((node) => node.id !== 'node_input' && node.id !== 'node_output')
  nextNodes.unshift({
    id: 'node_input',
    type: 'input',
    position: inputNode?.position ?? { x: 50, y: 100 },
    data: {
      fileName,
      headers,
      portNames: inputNode?.data?.portNames || {},
      onDelete: resetApp
    }
  })
  nextNodes.push({
    id: 'node_output',
    type: 'output',
    position: outputNode?.position ?? { x: 700, y: 100 },
    data: {
      columns: outputColumns,
      portNames: outputNode?.data?.portNames || {},
      pinned: outputNode?.data?.pinned === true
    }
  })

  rawData.value = { fileName, headers, rows }
  edges.value = finalEdges
  nodes.value = nextNodes
  flowKey.value += 1
}
</script>