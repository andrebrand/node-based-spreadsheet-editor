<template>
  <div class="custom-node not-node">
    <NodeTitle v-model:label="data.label" default-label="🚫 Not Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['input']"
          default-name="Input"
          @update:name="setPortName('input', $event)"
        />
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

const props = defineProps<NodeProps<{ label?: string; portNames?: Record<string, string> }>>()

const { removeNodes } = useVueFlow()

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
