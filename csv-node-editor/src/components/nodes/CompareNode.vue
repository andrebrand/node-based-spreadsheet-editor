<template>
  <div class="custom-node compare-node">
    <NodeTitle v-model:label="data.label" default-label="⚖ Compare Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="leftString" type="target" :position="Position.Left" />
        <span>String 1</span>
      </div>

      <div class="port-row left">
        <Handle id="rightString" type="target" :position="Position.Left" />
        <span>String 2</span>
      </div>

      <div class="controls">
        <label>Compare:</label>
        <select v-model="data.operator">
          <option value="equals">Is Equal</option>
          <option value="not-equals">Is Not Equal</option>
          <option value="contains">Contains</option>
          <option value="starts-with">Starts With</option>
          <option value="ends-with">Ends With</option>
        </select>
      </div>

      <div class="port-row right">
        <span>true / false</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{
  operator: 'equals' | 'not-equals' | 'contains' | 'starts-with' | 'ends-with'
  label?: string
}>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>
