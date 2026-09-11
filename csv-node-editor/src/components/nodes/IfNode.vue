<template>
  <div class="custom-node if-node">
    <NodeTitle v-model:label="data.label" default-label="✅ If Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="condition" type="target" :position="Position.Left" />
        <span>If</span>
      </div>

      <div class="port-row left">
        <Handle id="then" type="target" :position="Position.Left" />
        <span>Then</span>
      </div>

      <div class="port-row left">
        <Handle id="else" type="target" :position="Position.Left" />
        <span>Else</span>
      </div>

      <div class="port-row right">
        <span>Output</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Delete node</button>
      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{ label?: string }>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>
