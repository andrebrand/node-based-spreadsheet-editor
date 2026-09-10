<template>
  <div class="custom-node input-node">
    <div class="node-header">📥 Input: {{ data.fileName || 'Keine Datei' }}</div>
    <div class="node-body">
      <div v-for="header in data.headers" :key="header" class="port-row right">
        <span>{{ header }}</span>
        <Handle :id="header" type="source" :position="Position.Right" />
      </div>
      <button class="delete-node-btn" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps<{
  fileName: string
  headers: string[]
  onDelete: () => void
}>>()

function deleteNode() {
  props.data.onDelete()
}
</script>