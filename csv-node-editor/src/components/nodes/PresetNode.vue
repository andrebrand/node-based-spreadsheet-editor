<template>
  <div class="custom-node preset-node">
    <NodeTitle v-model:label="data.label" :default-label="data.preset?.name || 'Preset'" />
    <div class="node-body">
      <div v-for="port in inputs" :key="port.id" class="port-row left">
        <Handle :id="port.id" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.[port.id]"
          :default-name="port.defaultName"
          @update:name="setPortName(port.id, $event)"
        />
      </div>

      <div v-for="port in outputs" :key="port.id" class="port-row right">
        <PortLabel
          :name="data.portNames?.[port.id]"
          :default-name="port.defaultName"
          @update:name="setPortName(port.id, $event)"
        />
        <Handle :id="port.id" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'
import PortLabel from './PortLabel.vue'
import { setNodePortName } from '../../composables/usePortNames'
import type { PresetPort } from '../../composables/usePresets'

const props = defineProps<NodeProps<{
  label?: string
  portNames?: Record<string, string>
  inputs?: PresetPort[]
  outputs?: PresetPort[]
  preset?: { name?: string }
}>>()

const { removeNodes } = useVueFlow()
const inputs = computed(() => props.data.inputs || [])
const outputs = computed(() => props.data.outputs || [])

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function deleteNode() {
  removeNodes([props.id])
}
</script>

<style scoped>
.preset-node { border-color: #059669; }
</style>