<template>
  <div class="custom-node input-node">
    <div class="node-header">📥 Input: {{ data.fileName || 'Keine Datei' }}</div>
    <div class="node-body">
      <div v-for="header in data.headers" :key="header" class="port-row right">
        <span>{{ header }}</span>
        <Handle :id="header" type="source" :position="Position.Right" />
      </div>
      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps<{
  fileName: string
  headers: string[]
}>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>