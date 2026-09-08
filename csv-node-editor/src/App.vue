<template>
  <div class="app-layout">
    <header class="app-header">
      <h2>CSV/Excel Node Editor</h2>
      <input ref="fileInput" type="file" accept=".csv, .xlsx, .xls" @change="handleFileUpload" />
      <button class="save-plan-btn" type="button" @click="savePlan">Plan speichern</button>
      <button class="load-plan-btn" type="button" @click="planFileInput?.click()">Plan laden</button>
      <input ref="planFileInput" class="hidden-file-input" type="file" accept=".json" @change="handlePlanLoad" />
    </header>

    <div class="main-content">
      <div class="editor-pane">
        <NodeEditor :flow-key="flowKey" :on-input-delete="resetApp" />
      </div>
      <div class="preview-pane">
        <TablePreview />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import NodeEditor from './components/NodeEditor.vue'
import TablePreview from './components/TablePreview.vue'
import { ref } from 'vue'
import type { Edge, Node } from '@vue-flow/core'
import { rawData, nodes, edges } from './composables/usePipeline'

const fileInput = ref<HTMLInputElement | null>(null)
const planFileInput = ref<HTMLInputElement | null>(null)
const flowKey = ref(0)

function resetApp() {
  rawData.value = {
    fileName: '',
    headers: [],
    rows: []
  }
  edges.value = []
  nodes.value = []
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
  const previousHeaders = rawData.value.headers
  const headerSet = new Set(headers)
  const validEdges: Edge[] = []

  ;(edges.value as Edge[]).forEach((edge) => {
    const sourceIsInput = edge.source === 'node_input'
    const targetIsOutput = edge.target === 'node_output'
    const sourceColumn = sourceIsInput ? edge.sourceHandle ?? '' : ''
    const targetHandle = targetIsOutput ? edge.targetHandle ?? '' : ''
    const targetColumn = targetHandle.startsWith('target-')
      ? targetHandle.slice('target-'.length)
      : ''

    const sourceStillExists = !sourceIsInput || (previousHeaders.includes(sourceColumn) && headerSet.has(sourceColumn))
    const targetStillExists = !targetIsOutput || (previousHeaders.includes(targetColumn) && headerSet.has(targetColumn))

    if (sourceStillExists && targetStillExists) validEdges.push(edge)
  })

  const nextNodes = nodeList.filter((node) => node.id !== 'node_input' && node.id !== 'node_output')
  nextNodes.unshift({
    id: 'node_input',
    type: 'input',
    position: inputNode?.position ?? { x: 50, y: 100 },
    data: { fileName, headers, onDelete: resetApp }
  })
  nextNodes.push({
    id: 'node_output',
    type: 'output',
    position: outputNode?.position ?? { x: 700, y: 100 },
    data: { columns: [...headers] }
  })

  rawData.value = { fileName, headers, rows }
  edges.value = validEdges
  nodes.value = nextNodes
  flowKey.value += 1
}
</script>