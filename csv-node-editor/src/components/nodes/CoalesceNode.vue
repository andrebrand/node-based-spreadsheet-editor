<template>
  <div class="custom-node coalesce-node">
    <div class="node-header">Coalesce Node</div>
    <div class="node-body">
      <div v-for="index in data.inputCount" :key="index" class="port-row left">
        <Handle :id="`input-${index - 1}`" type="target" :position="Position.Left" />
        <span>Input {{ index }}</span>
      </div>

      <button class="small-node-btn" type="button" @click="addInput">+ Input</button>

      <div class="port-row right">
        <span>Ausgabe</span>
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
  inputCount: number
}>>()

const { removeNodes } = useVueFlow()

function addInput() {
  props.data.inputCount += 1
}

function deleteNode() {
  removeNodes([props.id])
}
</script>
