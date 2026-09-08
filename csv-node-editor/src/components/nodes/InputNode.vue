<template>
  <div class="custom-node input-node">
    <div class="node-header">📥 Input: {{ data.fileName || 'Keine Datei' }}</div>
    <div class="node-body">
      <div v-for="header in data.headers" :key="header" class="port-row right">
        <span>{{ header }}</span>
        <Handle :id="header" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps<{
  fileName: string
  headers: string[]
}>>()
</script>