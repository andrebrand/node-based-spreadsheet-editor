<template>
  <div class="custom-node counter-node">
    <div class="node-header">Counter Node</div>
    <div class="node-body">
      <div class="controls">
        <label>Startwert:</label>
        <select v-model="data.startMode">
          <option value="manual">Manuell</option>
          <option value="input">Input</option>
        </select>

        <input
          v-if="data.startMode === 'manual'"
          v-model.number="data.startValue"
          type="number"
          placeholder="Startwert"
        />
      </div>

      <div v-if="data.startMode === 'input'" class="port-row left">
        <Handle id="start" type="target" :position="Position.Left" />
        <span>Startwert</span>
      </div>

      <div class="controls">
        <label>Schrittweite:</label>
        <input v-model.number="data.step" type="number" placeholder="1" />
      </div>

      <div class="port-row right">
        <span>Ausgabe</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn" type="button" @click="deleteNode">Node löschen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { Edge, NodeProps } from '@vue-flow/core'
import { edges } from '../../composables/usePipeline'

const props = defineProps<NodeProps<{
  startMode: 'manual' | 'input'
  startValue: number
  step: number
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
