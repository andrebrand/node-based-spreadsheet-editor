<template>
  <div class="custom-node condition-node">
    <NodeTitle v-model:label="data.label" default-label="🔗 Condition Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="value1" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['value1']"
          default-name="Value 1"
          @update:name="setPortName('value1', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="value2" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['value2']"
          default-name="Value 2"
          @update:name="setPortName('value2', $event)"
        />
      </div>

      <div class="controls">
        <label>Operator:</label>
        <select v-model="data.operator" class="nodrag">
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="xor">XOR</option>
        </select>
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
  operator: 'and' | 'or' | 'xor'
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
