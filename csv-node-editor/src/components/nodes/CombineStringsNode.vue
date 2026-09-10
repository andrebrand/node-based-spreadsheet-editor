<template>
  <div class="custom-node combine-node">
    <NodeTitle v-model:label="data.label" default-label="Combine Strings" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="string1" type="target" :position="Position.Left" />
        <span>String1</span>
      </div>

      <div class="port-row left">
        <Handle id="string2" type="target" :position="Position.Left" />
        <span>String2</span>
      </div>

      <div class="port-row left">
        <Handle id="separator" type="target" :position="Position.Left" />
        <span>Separator</span>
      </div>

      <div class="port-row right">
        <span>Output</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
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
