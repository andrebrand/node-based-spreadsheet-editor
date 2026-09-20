<template>
  <div class="custom-node combine-node">
    <NodeTitle v-model:label="data.label" default-label="➕ Combine Strings" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="string1" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['string1']"
          default-name="String1"
          @update:name="setPortName('string1', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="string2" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['string2']"
          default-name="String2"
          @update:name="setPortName('string2', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="separator" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.['separator']"
          default-name="Separator"
          @update:name="setPortName('separator', $event)"
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
