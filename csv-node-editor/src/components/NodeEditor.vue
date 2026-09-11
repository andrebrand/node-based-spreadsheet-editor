<template>
  <div
    ref="editorContainerRef"
    class="editor-container"
    @pointerdown.capture="preventDragOnInteractive"
    @mousedown.capture="preventDragOnInteractive"
  >
    <div class="toolbar">
      <div class="node-menu">
        <button class="node-menu-toggle" type="button" :aria-expanded="openMenu === 'strings'" @click="toggleMenu('strings')">
          <span> + Functions</span>
          <span class="menu-chevron" :class="{ open: openMenu === 'strings' }" aria-hidden="true"></span>
        </button>
        <div v-if="openMenu === 'strings'" class="node-menu-items">
          <button @click="addRegexNode(); closeMenu()">💫 RegEx Node</button>
          <button @click="addStringNode(); closeMenu()">🆎 String Node</button>
          <button @click="addCombineStringsNode(); closeMenu()">➕ Combine Strings Node</button>
          <button @click="addCounterNode(); closeMenu()">💯 Counter Node</button>
          <button @click="addCoalesceNode(); closeMenu()">🔀 Coalesce Node</button>
          <button @click="addCompareNode(); closeMenu()">⚖ Compare Node</button>
          <button @click="addIfNode(); closeMenu()">✅ If Node</button>
          <button @click="addGroupNode(); closeMenu()">🔳 Group Node</button>
        </div>
      </div>
      <div class="hidden">
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
      id="flow-editor"
      :key="flowKey"
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :connection-mode="ConnectionMode.Strict"
      :is-valid-connection="isValidConnection"
      :delete-key-code="['Backspace', 'Delete']"
      @connect="onConnect"
      @nodes-change="onNodesChange"
      @node-drag-stop="onNodeDragStop"
      @edge-double-click="onEdgeDoubleClick"
      @click="closeMenu()"
      fit-view-on-init
    >
      <Background  />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { markRaw } from 'vue'
import { addEdge, ConnectionMode, useVueFlow, VueFlow } from '@vue-flow/core'
import type { Connection, Edge, EdgeMouseEvent, NodeChange } from '@vue-flow/core'
import type { NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodes, edges } from '../composables/usePipeline'

const editorContainerRef = ref<HTMLDivElement | null>(null)
const { project, dimensions, getViewport } = useVueFlow({ id: 'flow-editor' })

import InputNode from './nodes/InputNode.vue'
import OutputNode from './nodes/OutputNode.vue'
import RegexNode from './nodes/RegexNode.vue'
import StringNode from './nodes/StringNode.vue'
import CombineStringsNode from './nodes/CombineStringsNode.vue'
import JoinNode from './nodes/JoinNode.vue'
import SplitNode from './nodes/SplitNode.vue'
import CounterNode from './nodes/CounterNode.vue'
import CoalesceNode from './nodes/CoalesceNode.vue'
import CompareNode from './nodes/CompareNode.vue'
import IfNode from './nodes/IfNode.vue'
import GroupNode from './nodes/GroupNode.vue'

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

function preventDragOnInteractive(event: Event) {
  const target = event.target as HTMLElement | null
  if (!target) return
  const interactive = target.closest('input, select, textarea, button')
  if (interactive && !interactive.classList.contains('nodrag')) {
    interactive.classList.add('nodrag')
  }
}

const nodeTypes: NodeTypesObject = {
  input: markRaw(InputNode),
  output: markRaw(OutputNode),
  regex: markRaw(RegexNode),
  string: markRaw(StringNode),
  combine: markRaw(CombineStringsNode),
  join: markRaw(JoinNode),
  split: markRaw(SplitNode),
  counter: markRaw(CounterNode),
  coalesce: markRaw(CoalesceNode),
  compare: markRaw(CompareNode),
  if: markRaw(IfNode),
  group: markRaw(GroupNode)
}

function isValidConnection(connection: Connection) {
  if (!connection.sourceHandle || !connection.targetHandle) return false

  const nodeList = nodes.value as Array<{ id: string; type?: string }>
  const sourceNode = nodeList.find((node) => node.id === connection.source)
  const targetNode = nodeList.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) return false

  const sourceType = getHandleType(sourceNode.type, 'source')
  const targetType = getHandleType(targetNode.type, 'target')
  return sourceType === 'any' || targetType === 'any' || sourceType === targetType
}

function getHandleType(nodeType: string | undefined, side: 'source' | 'target') {
  if (nodeType === 'group') return 'any'
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

function onEdgeDoubleClick({ edge }: EdgeMouseEvent) {
  const remainingEdges: Edge[] = []
  const edgeList = edges.value as Edge[]

  edgeList.forEach((currentEdge) => {
    if (currentEdge.id !== edge.id) remainingEdges.push(currentEdge)
  })

  edges.value = remainingEdges
}

function onNodesChange(changes: NodeChange[]) {
  const nodeList = nodes.value as Array<{ id: string }>
  const inputStillExists = nodeList.some((node) => node.id === 'node_input')
  if (!inputStillExists && changes.some((change) => change.type === 'remove' && change.id === 'node_input')) {
    props.onInputDelete()
  }
}

function onNodeDragStop({ node }: { node: { id: string; type?: string; computedPosition?: { x: number; y: number }; dimensions?: { width: number; height: number }; parentNode?: string; position: { x: number; y: number } } }) {
  if (node.type === 'group') return

  const nodeList = nodes.value as Array<{ id: string; type?: string; computedPosition?: { x: number; y: number }; dimensions?: { width: number; height: number }; position: { x: number; y: number }; parentNode?: string }>
  const group = nodeList.find((candidate) => candidate.type === 'group')
  if (!group?.computedPosition || !group.dimensions || !node.computedPosition || !node.dimensions) return

  const insideGroup = node.computedPosition.x >= group.computedPosition.x &&
    node.computedPosition.y >= group.computedPosition.y &&
    node.computedPosition.x + node.dimensions.width <= group.computedPosition.x + group.dimensions.width &&
    node.computedPosition.y + node.dimensions.height <= group.computedPosition.y + group.dimensions.height

  if (insideGroup && node.parentNode !== group.id) {
    node.parentNode = group.id
    node.position = {
      x: node.computedPosition.x - group.computedPosition.x,
      y: node.computedPosition.y - group.computedPosition.y
    }
  } else if (!insideGroup && node.parentNode === group.id) {
    node.parentNode = undefined
    node.position = { x: node.computedPosition.x, y: node.computedPosition.y }
  }
}

function getSpawnPosition(nodeWidth = 220, nodeHeight = 160) {
  const vp = getViewport()
  const width = dimensions.value.width || editorContainerRef.value?.clientWidth || 800
  const height = dimensions.value.height || editorContainerRef.value?.clientHeight || 600

  const centerScreen = {
    x: width / 2,
    y: height / 2
  }

  let centerFlow: { x: number; y: number }
  try {
    centerFlow = project(centerScreen)
  } catch {
    const zoom = vp.zoom || 1
    centerFlow = {
      x: (centerScreen.x - (vp.x || 0)) / zoom,
      y: (centerScreen.y - (vp.y || 0)) / zoom
    }
  }

  let x = Math.round(centerFlow.x - nodeWidth / 2)
  let y = Math.round(centerFlow.y - nodeHeight / 2)

  const existingPositions = new Set(
    (nodes.value as Array<{ position: { x: number; y: number } }>).map(
      (n) => `${n.position.x},${n.position.y}`
    )
  )
  while (existingPositions.has(`${x},${y}`)) {
    x += 20
    y += 20
  }

  return { x, y }
}

function addRegexNode() {
  const id = `regex_${Date.now()}`
  nodes.value.push({
    id,
    type: 'regex',
    label: 'Regex',
    position: getSpawnPosition(220, 180),
    data: { pattern: '', replacement: '', mode: 'match', flags: '' }
  })
}

function addStringNode() {
  const id = `string_${Date.now()}`
  nodes.value.push({
    id,
    type: 'string',
    label: 'String',
    position: getSpawnPosition(220, 140),
    data: { value: '' }
  })
}

function addCombineStringsNode() {
  const id = `combine_${Date.now()}`
  nodes.value.push({
    id,
    type: 'combine',
    label: 'Combine Strings',
    position: getSpawnPosition(220, 170),
    data: {}
  })
}

function addJoinNode() {
  const id = `join_${Date.now()}`
  nodes.value.push({
    id,
    type: 'join',
    label: 'Join',
    position: getSpawnPosition(220, 160),
    data: { inputCount: 2 }
  })
}

function addSplitNode() {
  const id = `split_${Date.now()}`
  nodes.value.push({
    id,
    type: 'split',
    label: 'Split',
    position: getSpawnPosition(220, 160),
    data: { outputCount: 2 }
  })
}

function addCounterNode() {
  const id = `counter_${Date.now()}`
  nodes.value.push({
    id,
    type: 'counter',
    label: 'Counter',
    position: getSpawnPosition(220, 180),
    data: { startMode: 'manual', startValue: 0, step: 1 }
  })
}

function addCoalesceNode() {
  const id = `coalesce_${Date.now()}`
  nodes.value.push({
    id,
    type: 'coalesce',
    label: 'Coalesce',
    position: getSpawnPosition(220, 160),
    data: { inputCount: 2 }
  })
}

function addCompareNode() {
  const id = `compare_${Date.now()}`
  nodes.value.push({
    id,
    type: 'compare',
    label: 'Compare',
    position: getSpawnPosition(220, 160),
    data: { operator: 'equals' }
  })
}

function addIfNode() {
  const id = `if_${Date.now()}`
  nodes.value.push({
    id,
    type: 'if',
    label: 'If',
    position: getSpawnPosition(220, 170),
    data: {}
  })
}

function addGroupNode() {
  const id = `group_${Date.now()}`
  nodes.value.push({
    id,
    type: 'group',
    label: 'Group',
    position: getSpawnPosition(420, 260),
    width: 420,
    height: 260,
    data: {}
  })
}
</script>