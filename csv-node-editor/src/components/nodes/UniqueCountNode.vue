<template>
  <div class="custom-node unique-count-node">
    <NodeTitle v-model:label="data.label" default-label="🔢 Unique Count Node" />
    <div class="node-body">
      <div class="controls">
        <label>Input method:</label>
        <select v-model="data.startMode" class="nodrag">
          <option value="manual">Static</option>
          <option value="input">Node</option>
        </select>
        <template v-if="data.startMode === 'manual'">
          <label>Start value:</label>
          <input
            v-model.number="data.startValue"
            class="nodrag"
            type="number"
            placeholder="1"
          />
        </template>
      </div>

      <div v-if="data.startMode === 'input'" class="port-row left">
        <Handle id="start" type="target" :position="Position.Left" />
        <span>Start value</span>
      </div>

      <div class="controls">
        <label>Step size:</label>
        <input v-model.number="data.step" class="nodrag" type="number" placeholder="1" />
      </div>

      <div class="controls">
        <label>Mode:</label>
        <select v-model="data.mode" class="nodrag">
          <option value="id">Unique ID</option>
          <option value="running">Running count</option>
        </select>
      </div>

      <div class="inputs-section">
        <div v-for="index in (data.inputCount || 1)" :key="index" class="port-row left">
          <Handle :id="`input-${index - 1}`" type="target" :position="Position.Left" />
          <span>Input {{ index }}</span>
        </div>

        <div style="display: flex; gap: 4px;">
          <button class="small-node-btn nodrag" type="button" @click="addInput">+ Input</button>
          <button
            v-if="(data.inputCount || 1) > 1"
            class="small-node-btn nodrag"
            type="button"
            @click="removeInput"
          >
            - Input
          </button>
        </div>
      </div>

      <div class="port-row right">
        <span>Output</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
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
  inputCount: number
  mode?: 'id' | 'running'
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

function addInput() {
  props.data.inputCount = (props.data.inputCount || 1) + 1
}

function removeInput() {
  if ((props.data.inputCount || 1) <= 1) return
  const removedHandle = `input-${props.data.inputCount - 1}`
  props.data.inputCount -= 1

  const edgeList = edges.value as Edge[]
  const remainingEdges: Edge[] = []
  edgeList.forEach((edge) => {
    if (edge.target !== props.id || edge.targetHandle !== removedHandle) {
      remainingEdges.push(edge)
    }
  })
  edges.value = remainingEdges
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
