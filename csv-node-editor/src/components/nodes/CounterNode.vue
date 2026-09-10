<template>
  <div class="custom-node counter-node">
    <NodeTitle v-model:label="data.label" default-label="💯 Counter Node" />
    <div class="node-body">
      <div class="controls">
        <label>Input method:</label>
        <select v-model="data.startMode">
          <option value="manual">Static</option>
          <option value="input">Node</option>
        </select>
        <template v-if="data.startMode === 'manual'">
          <label>Start value:</label>
          <input
            v-model.number="data.startValue"
            type="number"
            placeholder="Start value"
          />
        </template>
      </div>

      <div v-if="data.startMode === 'input'" class="port-row left">
        <Handle id="start" type="target" :position="Position.Left" />
        <span>Start value</span>
      </div>

      <div class="controls">
        <label>Step size:</label>
        <input v-model.number="data.step" type="number" placeholder="1" />
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
import { watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { Edge, NodeProps } from '@vue-flow/core'
import { edges } from '../../composables/usePipeline'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{
  startMode: 'manual' | 'input'
  startValue: number
  step: number
  label?: string
}>>()

const { removeNodes } = useVueFlow()

watch(() => props.data.startMode, (mode) => {
  if (mode !== 'manual') return

  const edgeList = edges.value as Edge[]
  const remainingEdges: Edge[] = []
  edgeList.forEach((edge) => {
    if (edge.target !== props.id || edge.targetHandle !== 'start') {
      remainingEdges.push(edge)
    }
  })
  edges.value = remainingEdges
})

function deleteNode() {
  removeNodes([props.id])
}
</script>
