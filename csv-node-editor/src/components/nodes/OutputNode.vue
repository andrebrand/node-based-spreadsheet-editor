<template>
  <div class="custom-node output-node">
    <div class="node-header">📤 Output Schema</div>
    <div class="node-body">
      <div class="add-column">
        <input 
          v-model="newCol" 
          placeholder="Neue Spalte..." 
          @keyup.enter="addColumn" 
        />
        <button @click="addColumn">+</button>
      </div>

      <div v-for="col in data.columns" :key="col" class="port-row left">
        <Handle :id="`target-${col}`" type="target" :position="Position.Left" />
        <span>{{ col }}</span>
        <button class="remove-btn" @click="removeColumn(col)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { Edge, NodeProps } from '@vue-flow/core'
import { edges } from '../../composables/usePipeline'

const props = defineProps<NodeProps<{
  columns: string[]
}>>()

const newCol = ref('')

function addColumn() {
  if (!newCol.value.trim()) return
  if (!props.data.columns.includes(newCol.value)) {
    props.data.columns.push(newCol.value.trim())
  }
  newCol.value = ''
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
}
</script>