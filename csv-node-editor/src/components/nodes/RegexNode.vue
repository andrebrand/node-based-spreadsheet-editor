<template>
  <div class="custom-node transform-node">
    <NodeTitle v-model:label="data.label" default-label="💫 RegEx Bearbeitung" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <span>Input</span>
      </div>

      <div class="controls">
        <label>Mode:</label>
        <select v-model="data.mode">
          <option value="match">Filter Match</option>
          <option value="replace">Replace</option>
        </select>

        <label>Regex Pattern:</label>
        <input type="text" v-model="data.pattern" placeholder="z.B. \d+" />

        <template v-if="data.mode === 'replace'">
          <label>Ersatz-Text:</label>
          <input type="text" v-model="data.replacement" placeholder="Ersatz..." />
        </template>
      </div>

      <div class="port-row right">
        <span>Output</span>
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
  pattern: string
  replacement: string
  mode: 'match' | 'replace'
  flags: string
  label?: string
}>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>