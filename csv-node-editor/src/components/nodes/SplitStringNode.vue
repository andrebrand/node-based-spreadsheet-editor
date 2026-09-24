<template>
  <div class="custom-node split-string-node">
    <NodeTitle v-model:label="data.label" default-label="✂ Split String" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.input"
          default-name="Input"
          @update:name="setPortName('input', $event)"
        />
      </div>

      <div class="port-row left">
        <Handle id="separator" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.separator"
          default-name="Separator"
          @update:name="setPortName('separator', $event)"
        />
      </div>

      <div v-for="index in data.outputCount" :key="index" class="port-row right">
        <PortLabel
          :name="data.portNames?.[`output-${index - 1}`]"
          :default-name="`Output ${index}`"
          @update:name="setPortName(`output-${index - 1}`, $event)"
        />
        <Handle :id="`output-${index - 1}`" type="source" :position="Position.Right" />
      </div>

      <button class="small-node-btn nodrag" type="button" @click="addOutput">+ Output</button>
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
  outputCount: number
  label?: string
  portNames?: Record<string, string>
}>>()

const { removeNodes } = useVueFlow()

function setPortName(portId: string, name: string) {
  setNodePortName(props.data, portId, name)
}

function addOutput() {
  props.data.outputCount += 1
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
