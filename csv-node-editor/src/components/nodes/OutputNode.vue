<template>
  <div class="custom-node output-node">
    <div class="node-header">📤 Output Schema</div>
    <div class="node-body">
      <div class="add-column">
        <input 
          v-model="newCol" 
          placeholder="Neue Spalte..." 
          @keyup.enter="addColumn" 
          @paste.prevent="pasteColumns"
        />
        <button @click="addColumn">+</button>
      </div>

      <div
        v-for="col in data.columns"
        :key="col"
        class="port-row left output-column-row nodrag"
        :class="{ 'drag-over': dragOverColumn === col }"
        draggable="true"
        @dragstart.stop="startColumnDrag(col)"
        @dragend="finishColumnDrag"
        @dragover.prevent.stop="previewColumnDrop(col)"
        @drop.prevent.stop="dropColumn(col)"
      >
        <Handle :id="`target-${col}`" type="target" :position="Position.Left" />
        <span>{{ col }}</span>
        <button class="remove-btn" @click="removeColumn(col)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { Edge, NodeProps } from '@vue-flow/core'
import { edges } from '../../composables/usePipeline'

const props = defineProps<NodeProps<{
  columns: string[]
}>>()

const newCol = ref('')
const draggedColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)
const { updateNodeInternals } = useVueFlow()

function refreshConnections() {
  nextTick(() => updateNodeInternals([props.id]))
}

function startColumnDrag(col: string) {
  draggedColumn.value = col
}

function previewColumnDrop(targetCol: string) {
  dragOverColumn.value = targetCol
}

function dropColumn(targetCol: string) {
  const sourceCol = draggedColumn.value
  if (!sourceCol || sourceCol === targetCol) return

  const sourceIndex = props.data.columns.indexOf(sourceCol)
  const targetIndex = props.data.columns.indexOf(targetCol)
  if (sourceIndex === -1 || targetIndex === -1) return

  props.data.columns.splice(sourceIndex, 1)
  const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
  props.data.columns.splice(insertIndex, 0, sourceCol)
  finishColumnDrag()
}

function finishColumnDrag() {
  draggedColumn.value = null
  dragOverColumn.value = null
  refreshConnections()
}

function addColumn() {
  if (!newCol.value.trim()) return
  if (!props.data.columns.includes(newCol.value)) {
    props.data.columns.push(newCol.value.trim())
  }
  newCol.value = ''
  refreshConnections()
}

async function pasteColumns(event: ClipboardEvent) {
  try {
    const clipboardText = event.clipboardData?.getData('text') ?? ''
    const columns = [...new Set(
      clipboardText
        .split(/[\t\r\n]+/)
        .map((column) => column.trim())
        .filter(Boolean)
    )]

    if (!columns.length) return

    const columnHandles = new Set(columns.map((column) => `target-${column}`))
    const edgeList = edges.value as Edge[]
    const remainingEdges: Edge[] = []
    edgeList.forEach((edge) => {
      if (edge.target !== props.id || columnHandles.has(edge.targetHandle ?? '')) {
        remainingEdges.push(edge)
      }
    })

    props.data.columns.splice(0, props.data.columns.length, ...columns)
    newCol.value = ''
    edges.value = remainingEdges
    refreshConnections()
  } catch {
    window.alert('Die Zwischenablage konnte nicht gelesen werden.')
  }
}

function removeColumn(col: string) {
  const idx = props.data.columns.indexOf(col)
  if (idx === -1) return

  const handleId = `target-${col}`
  const edgeList = edges.value as Edge[]
  const remainingEdges: Edge[] = []
  edgeList.forEach((edge) => {
    if (edge.targetHandle !== handleId) remainingEdges.push(edge)
  })
  edges.value = remainingEdges
  props.data.columns.splice(idx, 1)
  refreshConnections()
}
</script>