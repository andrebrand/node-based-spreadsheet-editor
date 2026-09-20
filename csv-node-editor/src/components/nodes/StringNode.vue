<template>
  <div class="custom-node string-node">
    <NodeTitle v-model:label="data.label" default-label="🆎 StringNode" />
    <div class="node-body">
      <div class="controls">
        <label for="string-value">Static text:</label>
        <input
          id="string-value"
          v-model="data.value"
          class="nodrag"
          type="text"
          placeholder="Input text..."
        />
      </div>

      <div class="port-row right">
        <PortLabel
          :name="data.portNames?.['output']"
          default-name="Output"
          @update:name="setPortName('output', $event)"
        />
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'
import PortLabel from './PortLabel.vue'
import { setNodePortName } from '../../composables/usePortNames'

const props = defineProps<NodeProps<{
  value: string
  label?: string
  portNames?: Record<string, string>
}>>()

const { removeNodes } = useVueFlow()

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
