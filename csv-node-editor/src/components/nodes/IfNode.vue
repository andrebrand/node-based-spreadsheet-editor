<template>
  <div class="custom-node if-node">
    <NodeTitle v-model:label="data.label" default-label="✅ If Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="condition" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['condition']"
          default-name="If"
          @update:name="setPortName('condition', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="then" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['then']"
          default-name="Then"
          @update:name="setPortName('then', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="else" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['else']"
          default-name="Else"
          @update:name="setPortName('else', $event)"
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

const props = defineProps<NodeProps<{ label?: string; portNames?: Record<string, string> }>>()

const { removeNodes } = useVueFlow()

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
