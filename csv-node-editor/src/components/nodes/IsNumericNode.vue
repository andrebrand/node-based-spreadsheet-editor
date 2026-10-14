<template>
  <div class="custom-node is-numeric-node">
    <NodeTitle v-model:label="data.label" default-label="🔢 IsNumeric Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['input']"
          default-name="Input"
          @update:name="setPortName('input', $event)"
        />
      </div>

      <div class="controls">
        <label class="checkbox-control">
          <input v-model="data.allowDecimalSeparators" class="nodrag" type="checkbox" />
          Allow comma and period as decimal separators
        </label>
      </div>

      <div class="port-row right">
        <PortLabel
          :name="data.portNames?.['output']"
          default-name="true / false"
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
  allowDecimalSeparators?: boolean
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

<style scoped>
.checkbox-control {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
}

.checkbox-control input {
  width: auto;
  margin: 0;
}
</style>
