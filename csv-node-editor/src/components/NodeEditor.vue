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
      @node-double-click="onNodeDoubleClick"
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
import type { Connection, Edge, EdgeMouseEvent, NodeChange, NodeMouseEvent } from '@vue-flow/core'
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

  const nodeList = nodes.value as Array<{ id: string; type?: string; computedPosition?: { x: number; y: number }; dimensions?: { width: number; height: number }; position: { x: number; y: number }; parentNode?: string; data?: any; width?: number; height?: number }>
  const groups = nodeList.filter((candidate) => candidate.type === 'group')
  const matchingGroup = groups.find((candidate) => {
    const groupWidth = candidate.data?.width || candidate.width || candidate.dimensions?.width
    const groupHeight = candidate.data?.height || candidate.height || candidate.dimensions?.height
    if (!candidate?.computedPosition || !groupWidth || !groupHeight || !node.computedPosition || !node.dimensions) return false
    return (
      node.computedPosition.x >= candidate.computedPosition.x &&
      node.computedPosition.y >= candidate.computedPosition.y &&
      node.computedPosition.x + node.dimensions.width <= candidate.computedPosition.x + groupWidth &&
      node.computedPosition.y + node.dimensions.height <= candidate.computedPosition.y + groupHeight
    )
  })

  if (matchingGroup?.computedPosition && node.computedPosition && node.parentNode !== matchingGroup.id) {
    node.parentNode = matchingGroup.id
    node.position = {
      x: node.computedPosition.x - matchingGroup.computedPosition.x,
      y: node.computedPosition.y - matchingGroup.computedPosition.y
    }
  } else if (!matchingGroup && node.parentNode && node.computedPosition) {
    node.parentNode = undefined
    node.position = { x: node.computedPosition.x, y: node.computedPosition.y }
  }
}

function copyRegularNode(node: any) {
  const nodeList = nodes.value as any[]
  const source = nodeList.find((n) => n.id === node.id) || node

  let offsetX = 30
  let offsetY = 30
  const existingPositions = new Set(
    nodeList.map((n) => `${n.position.x},${n.position.y}`)
  )
  while (existingPositions.has(`${source.position.x + offsetX},${source.position.y + offsetY}`)) {
    offsetX += 20
    offsetY += 20
  }

  const newId = `${source.type || 'node'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const newNode = {
    id: newId,
    type: source.type,
    label: source.label,
    position: {
      x: source.position.x + offsetX,
      y: source.position.y + offsetY
    },
    parentNode: source.parentNode,
    data: JSON.parse(JSON.stringify(source.data || {}))
  }

  ;(nodes.value as any[]).push(newNode)
}

function copyGroupNode(group: any) {
  const nodeList = nodes.value as any[]
  const sourceGroup = nodeList.find((n) => n.id === group.id) || group

  // Width and height are tracked directly by the GroupNode when scaling
  const groupWidth = sourceGroup.data?.width || sourceGroup.width || 420
  const groupHeight = sourceGroup.data?.height || sourceGroup.height || 260

  // Find all child nodes inside this group
  const groupCompPos = group.computedPosition || sourceGroup.computedPosition || sourceGroup.position
  const innerNodes = nodeList.filter((n) => {
    if (n.id === sourceGroup.id || n.type === 'input' || n.type === 'output') return false
    if (n.parentNode === sourceGroup.id) return true

    const childCompPos = n.computedPosition || n.position
    const childDim = n.dimensions || { width: 220, height: 160 }

    if (groupCompPos && childCompPos) {
      return (
        childCompPos.x >= groupCompPos.x &&
        childCompPos.y >= groupCompPos.y &&
        childCompPos.x + childDim.width <= groupCompPos.x + groupWidth &&
        childCompPos.y + childDim.height <= groupCompPos.y + groupHeight
      )
    }
    return false
  })

  // Group offset to avoid stacking directly on top of original
  let offsetX = 40
  let offsetY = 40
  const existingPositions = new Set(
    nodeList.map((n) => `${n.position.x},${n.position.y}`)
  )
  while (existingPositions.has(`${sourceGroup.position.x + offsetX},${sourceGroup.position.y + offsetY}`)) {
    offsetX += 20
    offsetY += 20
  }

  const idMap = new Map<string, string>()
  const newGroupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  idMap.set(sourceGroup.id, newGroupId)

  for (const child of innerNodes) {
    const newChildId = `${child.type || 'node'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    idMap.set(child.id, newChildId)
  }

  const newGroupNode = {
    id: newGroupId,
    type: 'group',
    label: sourceGroup.label || 'Group',
    position: {
      x: sourceGroup.position.x + offsetX,
      y: sourceGroup.position.y + offsetY
    },
    width: groupWidth,
    height: groupHeight,
    style: {
      ...(sourceGroup.style || {}),
      width: `${groupWidth}px`,
      height: `${groupHeight}px`
    },
    data: {
      ...JSON.parse(JSON.stringify(sourceGroup.data || {})),
      width: groupWidth,
      height: groupHeight
    }
  }

  const newChildNodes = innerNodes.map((child) => {
    let relPos = { ...child.position }
    const childPos = child.computedPosition || child.position
    if (!child.parentNode && groupCompPos && childPos) {
      relPos = {
        x: childPos.x - groupCompPos.x,
        y: childPos.y - groupCompPos.y
      }
    }

    return {
      id: idMap.get(child.id)!,
      type: child.type,
      label: child.label,
      position: relPos,
      parentNode: newGroupId,
      data: JSON.parse(JSON.stringify(child.data || {}))
    }
  })

  // Duplicate internal connections between inner nodes and group internal ports
  const edgeList = edges.value as Edge[]
  const newEdges: Edge[] = []

  edgeList.forEach((e) => {
    if (idMap.has(e.source) && idMap.has(e.target)) {
      const newSource = idMap.get(e.source)!
      const newTarget = idMap.get(e.target)!
      newEdges.push({
        ...e,
        id: `e_${newSource}_${e.sourceHandle || ''}-${newTarget}_${e.targetHandle || ''}`,
        source: newSource,
        target: newTarget
      })
    }
  })

  ;(nodes.value as any[]).push(newGroupNode, ...newChildNodes)
  if (newEdges.length > 0) {
    ;(edges.value as any[]).push(...newEdges)
  }
}

function onNodeDoubleClick(event: NodeMouseEvent) {
  const domEvent = event.event
  const target = domEvent?.target as HTMLElement | null

  // Ignore double clicks on inputs, selects, buttons, title editing, handles, or resize controls
  if (target && target.closest('input, select, textarea, button, a, .vue-flow__resize-control, .vue-flow__handle, .node-title-text')) {
    return
  }

  const node = event.node
  if (!node) return

  // Do not duplicate singleton input or output nodes
  if (node.id === 'node_input' || node.id === 'node_output' || node.type === 'input' || node.type === 'output') {
    return
  }

  if (node.type === 'group') {
    copyGroupNode(node)
  } else {
    copyRegularNode(node)
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
    style: {
      width: '420px',
      height: '260px'
    },
    data: {
      width: 420,
      height: 260
    }
  })
}
</script>