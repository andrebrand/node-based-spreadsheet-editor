<template>
  <div class="custom-node compare-node">
    <div class="node-header">Compare Node</div>
    <div class="node-body">
      <div class="port-row left">
        <Handle id="left" type="target" :position="Position.Left" />
        <span>String 1</span>
      </div>

      <div class="port-row left">
        <Handle id="right" type="target" :position="Position.Left" />
        <span>String 2</span>
      </div>

      <div class="controls">
        <label>Vergleich:</label>
        <select v-model="data.operator">
          <option value="equals">Ist gleich</option>
          <option value="not-equals">Ist nicht gleich</option>
          <option value="contains">Enthält</option>
          <option value="starts-with">Beginnt mit</option>
          <option value="ends-with">Endet mit</option>
        </select>
      </div>

      <div class="port-row right">
        <span>true / false</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps<{
  operator: 'equals' | 'not-equals' | 'contains' | 'starts-with' | 'ends-with'
}>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>
