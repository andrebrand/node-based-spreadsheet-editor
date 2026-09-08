<template>
  <div class="app-layout">
    <header class="app-header">
      <h2>CSV/Excel Node Editor</h2>
      <input ref="fileInput" type="file" accept=".csv, .xlsx, .xls" @change="handleFileUpload" />
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