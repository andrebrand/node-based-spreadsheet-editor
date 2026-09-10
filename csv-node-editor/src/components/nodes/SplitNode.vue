<template>
  <div class="custom-node split-node">
    <NodeTitle v-model:label="data.label" default-label="Split Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <span>Array</span>
      </div>

      <div v-for="index in data.outputCount" :key="index" class="port-row right">
        <span>Output {{ index }}</span>
        <Handle :id="`output-${index - 1}`" type="source" :position="Position.Right" />
      </div>

      <button class="small-node-btn" type="button" @click="addOutput">+ Output</button>
      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{
  outputCount: number
  label?: string
}>>()

const { removeNodes } = useVueFlow()

function addOutput() {
  props.data.outputCount += 1
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
