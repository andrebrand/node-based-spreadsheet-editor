<template>
  <div class="editor-container">
    <div class="toolbar">
      <button @click="addRegexNode">+ RegEx Node hinzufügen</button>
      <button @click="addStringNode">+ String Node hinzufügen</button>
      <button @click="addCombineStringsNode">+ Combine Strings Node hinzufügen</button>
    </div>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :connection-mode="ConnectionMode.Strict"
      :is-valid-connection="isValidConnection"
      :delete-key-code="['Backspace', 'Delete']"
      @connect="onConnect"
      fit-view-on-init
    >
      <Background />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { addEdge, ConnectionMode, VueFlow } from '@vue-flow/core'
import type { Connection, Edge } from '@vue-flow/core'
import type { NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodes, edges } from '../composables/usePipeline'

import InputNode from './nodes/InputNode.vue'
import OutputNode from './nodes/OutputNode.vue'
import RegexNode from './nodes/RegexNode.vue'
import StringNode from './nodes/StringNode.vue'
import CombineStringsNode from './nodes/CombineStringsNode.vue'

const nodeTypes: NodeTypesObject = {
  input: markRaw(InputNode),
  output: markRaw(OutputNode),
  regex: markRaw(RegexNode),
  string: markRaw(StringNode),
  combine: markRaw(CombineStringsNode)
}

function isValidConnection(connection: Connection) {
  return Boolean(connection.sourceHandle && connection.targetHandle)
}

function onConnect(connection: Connection) {
  const existingEdges = edges.value as Edge[]
  const remainingEdges: Edge[] = []

  existingEdges.forEach((edge) => {
    if (edge.target !== connection.target || edge.targetHandle !== connection.targetHandle) {
      remainingEdges.push(edge)
    }
  })

  edges.value = addEdge(connection, remainingEdges) as Edge[]
}

function addRegexNode() {
  const id = `regex_${Date.now()}`
  nodes.value.push({
    id,
    type: 'regex',
    label: 'Regex',
    position: { x: 350, y: 150 },
    data: { pattern: '', replacement: '', mode: 'match', flags: 'g' }
  })
}

function addStringNode() {
  const id = `string_${Date.now()}`
  nodes.value.push({
    id,
    type: 'string',
    label: 'String',
    position: { x: 350, y: 350 },
    data: { value: '' }
  })
}

function addCombineStringsNode() {
  const id = `combine_${Date.now()}`
  nodes.value.push({
    id,
    type: 'combine',
    label: 'Combine Strings',
    position: { x: 600, y: 350 },
    data: {}
  })
}
</script>