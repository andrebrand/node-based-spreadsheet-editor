<template>
  <div class="app-layout">
    <header class="app-header">
      <h2>CSV/Excel Node Editor</h2>
      <input ref="fileInput" type="file" accept=".csv, .xlsx, .xls" @change="handleFileUpload" />
    </header>

    <div class="main-content">
      <div class="editor-pane">
        <NodeEditor :on-input-delete="resetApp" />
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
import { rawData, nodes, edges } from './composables/usePipeline'

const fileInput = ref<HTMLInputElement | null>(null)

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

    rawData.value = {
      fileName: file.name,
      headers,
      rows: json
    }

    // Graph zurücksetzen und Start-Knoten setzen
    edges.value = []
    nodes.value = [
      {
        id: 'node_input',
        type: 'input',
        position: { x: 50, y: 100 },
        data: { fileName: file.name, headers, onDelete: resetApp }
      },
      {
        id: 'node_output',
        type: 'output',
        position: { x: 700, y: 100 },
        data: { columns: [...headers] }
      }
    ]
  }
  reader.readAsArrayBuffer(file)
}
</script>