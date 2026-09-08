<template>
  <div class="editor-container">
    <div class="toolbar">
      <button @click="addRegexNode">+ RegEx Node hinzufügen</button>
    </div>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
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
import { addEdge, VueFlow } from '@vue-flow/core'
import type { Connection, Edge } from '@vue-flow/core'
import type { NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodes, edges } from '../composables/usePipeline'

import InputNode from './nodes/InputNode.vue'
import OutputNode from './nodes/OutputNode.vue'
import RegexNode from './nodes/RegexNode.vue'

const nodeTypes: NodeTypesObject = {
  input: markRaw(InputNode),
  output: markRaw(OutputNode),
  regex: markRaw(RegexNode)
}

function onConnect(connection: Connection) {
  edges.value = addEdge(connection, edges.value as Edge[]) as Edge[]
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
</script>