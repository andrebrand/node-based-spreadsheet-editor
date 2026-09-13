<template>
  <div
    ref="editorContainerRef"
    class="editor-container"
    @pointerdown.capture="preventDragOnInteractive"
    @mousedown.capture="preventDragOnInteractive"
  >
    <div class="toolbar">
      <DropDownButton :options="{
          icon: IconPlus,
          label: 'Functions'
        }"

        v-model="isFunctionMenuOpen"

        :items="[{
          label: 'RegEx Node',
          value: 'regex',
          icon:  IconCodeAsterisk
        },{
          label: 'String Node',
          value: 'string',
          icon:  IconTextRecognition
        },{
          label: 'Combine String Node',
          value: 'combine',
          icon:  IconArrowMerge
        },{
          label: 'Counter Node',
          value: 'counter',
          icon:  IconNumber123
        },{
          label: 'Compare Node',
          value: 'compare',
          icon:  IconEqualNot
        },{
          label: 'Coalesce Node',
          value: 'coalesce',
          icon:  IconArrowMergeAltRight
        },{
          label: 'If Node',
          value: 'if',
          icon:  IconLogicAnd
        },{
          label: 'Group Node',
          value: 'group',
          icon:  IconBoxMargin
        }]"
        @itemClicked="addNode($event)"
      />

      <DropDownButton :options="{
          icon: IconTournament,
          label: 'Presets'
        }"

        v-model="isPresetsMenuOpen"

        :items="presets.map(v => ({label: v.name, value: v.id}))"
        @itemClicked="handleSpawnPreset($event)"
      />
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
      @click="closeMenus()"
      fit-view-on-init
    >
      <Background  />
      <Controls />
    </VueFlow>

    <!-- Naming Dialog Modal -->
    <div v-if="namingDialog.isOpen" class="modal-backdrop" @click.self="closeNamingDialog">
      <div class="modal-dialog">
        <h3 class="modal-title">Enter Preset name</h3>
        <p class="modal-desc">Please enter a name for your preset:</p>
        <input
          ref="presetNameInputRef"
          v-model="namingDialog.name"
          class="modal-input nodrag"
          type="text"
          placeholder="Preset name..."
          @keydown.enter.prevent="submitNamingDialog"
          @keydown.escape.prevent="closeNamingDialog"
        />
        <div class="modal-actions">
          <button class="modal-btn cancel" type="button" @click="closeNamingDialog">Cancel</button>
          <button
            class="modal-btn confirm"
            type="button"
            :disabled="!namingDialog.name.trim()"
            @click="submitNamingDialog"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, nextTick, computed, type ComputedRef} from 'vue'
import { addEdge, ConnectionMode, VueFlow } from '@vue-flow/core'
import type { Connection, Edge, EdgeMouseEvent, NodeChange, NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodes, edges } from '../composables/usePipeline'
import {
  presets,
  namingDialog,
  deletePreset,
  spawnPreset,
  closeNamingDialog,
  confirmNamingDialog,
  type GroupPreset
} from '../composables/usePresets'
import DropDownButton from "./core/DropDownButton.vue";
import {
  IconArrowMerge,
  IconArrowMergeAltRight,
  IconBoxMargin, IconCodeAsterisk,
  IconEqualNot, IconNumber123,
  IconPlus,
  IconLogicAnd, IconTextRecognition, IconTournament
} from "@tabler/icons-vue";
import {nodeTypes, useAddNode} from "../composables/useAddNode.ts";

const props = defineProps<{
  flowKey: number
  onInputDelete: () => void
}>()

const presetMap: ComputedRef<Map<string, GroupPreset>> = computed(() => {
  return new Map((presets.value ?? []).map(v => [v.id, v]))
})


const editorContainerRef = ref<HTMLDivElement | null>(null)
const presetNameInputRef = ref<HTMLInputElement | null>(null)


const {addNode, getSpawnPosition} = useAddNode(editorContainerRef);

watch(
    () => namingDialog.value.isOpen,
    (isOpen) => {
      if (isOpen) {
        nextTick(() => {
          presetNameInputRef.value?.focus()
          presetNameInputRef.value?.select()
        })
      }
    }
)

function submitNamingDialog() {
  confirmNamingDialog()
}

function handleSpawnPreset(presetId: string) {
  if(!presetMap.value.has(presetId)){
    return
  }
  const preset = presetMap.value.get(presetId)!;
  const spawnPos = getSpawnPosition(preset.width, preset.height)
  spawnPreset(preset, spawnPos)
}

const isFunctionMenuOpen = ref(false);
const isPresetsMenuOpen = ref(false);

watch(isFunctionMenuOpen, (isOpen) => {
  if (isOpen){
    isPresetsMenuOpen.value = false;
  }
});

watch(isPresetsMenuOpen, (isOpen) => {
  if (isOpen){
    isFunctionMenuOpen.value = false;
  }
});

const closeMenus = () => {
  isPresetsMenuOpen.value = false;
  isFunctionMenuOpen.value = false;
}

function preventDragOnInteractive(event: Event) {
  const target = event.target as HTMLElement | null
  if (!target) return
  const interactive = target.closest('input, select, textarea, button')
  if (interactive && !interactive.classList.contains('nodrag')) {
    interactive.classList.add('nodrag')
  }
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
</script>