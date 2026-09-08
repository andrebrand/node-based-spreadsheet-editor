<template>
  <div class="editor-container">
    <div class="toolbar">
      <div class="node-menu">
        <button class="node-menu-toggle" type="button" :aria-expanded="openMenu === 'strings'" @click="toggleMenu('strings')">
          <span>Strings</span>
          <span class="menu-chevron" :class="{ open: openMenu === 'strings' }" aria-hidden="true"></span>
        </button>
        <div v-if="openMenu === 'strings'" class="node-menu-items">
          <button @click="addRegexNode(); closeMenu()">+ RegEx Node</button>
          <button @click="addStringNode(); closeMenu()">+ String Node</button>
          <button @click="addCombineStringsNode(); closeMenu()">+ Combine Strings Node</button>
          <button @click="addCounterNode(); closeMenu()">+ Counter Node</button>
        </div>
      </div>
      <div class="node-menu">
        <button class="node-menu-toggle array-menu-toggle" type="button" :aria-expanded="openMenu === 'arrays'" @click="toggleMenu('arrays')">
          <span>Array Functions</span>
          <span class="menu-chevron" :class="{ open: openMenu === 'arrays' }" aria-hidden="true"></span>
        </button>
        <div v-if="openMenu === 'arrays'" class="node-menu-items">
          <button @click="addJoinNode(); closeMenu()">+ Join Node</button>
          <button @click="addSplitNode(); closeMenu()">+ Split Node</button>
        </div>
      </div>
    </div>
    <VueFlow
      :key="flowKey"
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
import { ref } from 'vue'
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
import CounterNode from './nodes/CounterNode.vue'

const props = defineProps<{
  flowKey: number
  onInputDelete: () => void
}>()

const openMenu = ref<'strings' | 'arrays' | null>(null)

function toggleMenu(menu: 'strings' | 'arrays') {
  openMenu.value = openMenu.value === menu ? null : menu
}

function closeMenu() {
  openMenu.value = null
}

const nodeTypes: NodeTypesObject = {
  input: markRaw(InputNode),
  output: markRaw(OutputNode),
  regex: markRaw(RegexNode),
  string: markRaw(StringNode),
  combine: markRaw(CombineStringsNode),
  join: markRaw(JoinNode),
  split: markRaw(SplitNode),
  counter: markRaw(CounterNode)
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

function addCounterNode() {
  const id = `counter_${Date.now()}`
  nodes.value.push({
    id,
    type: 'counter',
    label: 'Counter',
    position: { x: 350, y: 550 },
    data: { startMode: 'manual', startValue: 0, step: 1 }
  })
}
</script>