<template>
  <div class="editor-container">
    <div class="toolbar">
      <button @click="addRegexNode">+ RegEx Node hinzufügen</button>
      <button @click="addStringNode">+ String Node hinzufügen</button>
      <button @click="addCombineStringsNode">+ Combine Strings Node hinzufügen</button>
      <button @click="addJoinNode">+ Join Node hinzufügen</button>
      <button @click="addSplitNode">+ Split Node hinzufügen</button>
    </div>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :connection-mode="ConnectionMode.Strict"
      :is-valid-connection="isValidConnection"
      :delete-key-code="['Backspace', 'Delete']"
      @connect="onConnect"
      @nodes-change="onNodesChange"
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
import type { Connection, Edge, NodeChange } from '@vue-flow/core'
import type { NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodes, edges } from '../composables/usePipeline'

import InputNode from './nodes/InputNode.vue'
import OutputNode from './nodes/OutputNode.vue'
import RegexNode from './nodes/RegexNode.vue'
import StringNode from './nodes/StringNode.vue'
import CombineStringsNode from './nodes/CombineStringsNode.vue'
import JoinNode from './nodes/JoinNode.vue'
import SplitNode from './nodes/SplitNode.vue'

const props = defineProps<{
  onInputDelete: () => void
}>()

const nodeTypes: NodeTypesObject = {
  input: markRaw(InputNode),
  output: markRaw(OutputNode),
  regex: markRaw(RegexNode),
  string: markRaw(StringNode),
  combine: markRaw(CombineStringsNode),
  join: markRaw(JoinNode),
  split: markRaw(SplitNode)
}

function isValidConnection(connection: Connection) {
  if (!connection.sourceHandle || !connection.targetHandle) return false

  const nodeList = nodes.value as Array<{ id: string; type?: string }>
  const sourceNode = nodeList.find((node) => node.id === connection.source)
  const targetNode = nodeList.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) return false

  return getHandleType(sourceNode.type, 'source') === getHandleType(targetNode.type, 'target')
}

function getHandleType(nodeType: string | undefined, side: 'source' | 'target') {
  if (nodeType === 'join' && side === 'source') return 'array'
  if (nodeType === 'split' && side === 'target') return 'array'
  if (nodeType === 'split' && side === 'source') return 'string'
  if (nodeType === 'join' && side === 'target') return 'string'
  return 'string'
}

function onConnect(connection: Connection) {
  if (!isValidConnection(connection)) return

  const existingEdges = edges.value as Edge[]
  const remainingEdges: Edge[] = []

  existingEdges.forEach((edge) => {
    if (edge.target !== connection.target || edge.targetHandle !== connection.targetHandle) {
      remainingEdges.push(edge)
    }
  })

  edges.value = addEdge(connection, remainingEdges) as Edge[]
}

function onNodesChange(changes: NodeChange[]) {
  if (changes.some((change) => change.type === 'remove' && change.id === 'node_input')) {
    props.onInputDelete()
  }
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

function addJoinNode() {
  const id = `join_${Date.now()}`
  nodes.value.push({
    id,
    type: 'join',
    label: 'Join',
    position: { x: 600, y: 550 },
    data: { inputCount: 2 }
  })
}

function addSplitNode() {
  const id = `split_${Date.now()}`
  nodes.value.push({
    id,
    type: 'split',
    label: 'Split',
    position: { x: 850, y: 550 },
    data: { outputCount: 2 }
  })
}
</script>