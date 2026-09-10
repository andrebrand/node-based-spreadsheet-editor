<template>
  <div class="custom-node string-node">
    <NodeTitle v-model:label="data.label" default-label="🆎 StringNode" />
    <div class="node-body">
      <div class="controls">
        <label for="string-value">Fester String:</label>
        <input
          id="string-value"
          v-model="data.value"
          type="text"
          placeholder="Text eingeben..."
        />
      </div>

      <div class="port-row right">
        <span>Ausgabe</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{
  value: string
  label?: string
}>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>
