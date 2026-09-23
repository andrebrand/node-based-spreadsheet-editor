<template>
  <div class="group-node">
    <NodeResizer
      :min-width="280"
      :min-height="180"
      @resize="onResize"
      @resize-end="onResize"
    />
    <NodeTitle v-model:label="data.label" default-label="🔳 Group Node" header-class="group-node-header" />
    <button
      class="group-save-btn nodrag"
      type="button"
      title="GroupNode als Preset speichern"
      @click.stop="handleSavePreset"
    >
      {{ saveStatus === 'saved' ? '✓ Gespeichert' : '💾 Preset' }}
    </button>

    <div class="inputs-column">
      <div
        v-for="(port, index) in inputList"
        :key="port.id"
        class="input-pair"
      >
        <div class="group-port outer-input">
          <Handle :id="port.id" type="target" :position="Position.Left" />
          <PortLabel
            :name="data.portNames?.[port.id]"
            :default-name="port.defaultName"
            @update:name="setPortName(port.id, $event)"
          />
          <button
              :class="inputList.length === 1 ? 'group-remove-btn nodrag inactive' : 'group-remove-btn nodrag'"
              type="button"
              title="Remove input port"
              @click.stop="inputList.length > 1 && removeInputPort(index)"
          >
            ×
          </button>
        </div>

        <div class="inner-input">
          <Handle :id="port.internalId" type="source" :position="Position.Right" />
        </div>


      </div>

      <button
        class="group-add-btn small-node-btn nodrag"
        type="button"
        @click.stop="addInputPort"
      >
        + Input
      </button>
    </div>

    <div class="outputs-column">
      <div
        v-for="(port, index) in outputList"
        :key="port.id"
        class="output-pair"
      >


        <div class="inner-output">
          <Handle :id="port.internalId" type="target" :position="Position.Left" />
        </div>

        <div class="group-port outer-output">
          <button

              :class="outputList.length === 1 ? 'group-remove-btn nodrag inactive' : 'group-remove-btn nodrag'"
              class="group-remove-btn nodrag"
              type="button"
              title="Remove output port"
              @click.stop="outputList.length > 1 && removeOutputPort(index)"
          >
            ×
          </button>
          <PortLabel
            :name="data.portNames?.[port.id]"
            :default-name="port.defaultName"
            @update:name="setPortName(port.id, $event)"
          />
          <Handle :id="port.id" type="source" :position="Position.Right" />
        </div>
      </div>

      <button
        class="group-add-btn small-node-btn nodrag"
        type="button"
        @click.stop="addOutputPort"
      >
        + Output
      </button>
    </div>

    <button class="delete-node-btn group-delete-btn nodrag" type="button" @click="deleteNode">Delete node</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { OnResize, OnResizeEnd } from '@vue-flow/node-resizer'
import type { NodeProps, Edge } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'
import PortLabel from './PortLabel.vue'
import { nodes, edges } from '../../composables/usePipeline'
import { isDefaultGroupName, openNamingDialog, saveGroupAsPreset } from '../../composables/usePresets'
import { setNodePortName } from '../../composables/usePortNames'


export interface GroupPortItem {
  id: string
  internalId: string
  defaultName: string
}

const props = defineProps<NodeProps<{
  label?: string
  width?: number
  height?: number
  portNames?: Record<string, string>
  inputs?: GroupPortItem[]
  outputs?: GroupPortItem[]
}>>()

const nodeId = computed(() => props.id)

const { removeNodes, findNode } = useVueFlow()

function makeHandleId(type: 'input' | 'output', baseId: string): string {
  return `${type}-${baseId}-${nodeId.value}`
}

if (props.data) {
  if (!Array.isArray(props.data.inputs)) {
    props.data.inputs = [
      { id: makeHandleId('input', 'input'), internalId: makeHandleId('input', 'internal-input'), defaultName: 'Input' }
    ]
  }
  if (!Array.isArray(props.data.outputs)) {
    props.data.outputs = [
      { id: makeHandleId('output', 'output'), internalId: makeHandleId('output', 'internal-output'), defaultName: 'Output' }
    ]
  }
}

const inputList = computed(() => props.data?.inputs || [])
const outputList = computed(() => props.data?.outputs || [])

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function addInputPort() {
  if (!props.data) return
  if (!Array.isArray(props.data.inputs)) {
    props.data.inputs = []
  }
  const inputBaseIds = new Set(props.data.inputs.map((p: GroupPortItem) => p.id.replace(`-${nodeId.value}`, '')))
  let baseId = 'input'
  let newId = makeHandleId('input', 'input')
  let newInternalId = makeHandleId('input', 'internal-input')
  let defaultName = 'Input'

  if (inputBaseIds.has('input')) {
    let index = 1
    while (inputBaseIds.has(`input-${index}`)) {
      index++
    }
    baseId = `input-${index}`
    newId = makeHandleId('input', baseId)
    newInternalId = makeHandleId('input', `internal-${baseId}`)
    defaultName = `Input ${index + 1}`
  }

  props.data.inputs.push({
    id: newId,
    internalId: newInternalId,
    defaultName
  })
}

function removeInputPort(index: number) {
  if (!props.data?.inputs) return
  const port = props.data.inputs[index]
  if (!port) return

  const edgeList = edges.value as Edge[]
  const remainingEdges: Edge[] = []
  edgeList.forEach((edge) => {
    const isTargetMatch = edge.target === props.id && edge.targetHandle === port.id
    const isSourceMatch = edge.source === props.id && edge.sourceHandle === port.internalId
    if (!isTargetMatch && !isSourceMatch) {
      remainingEdges.push(edge)
    }
  })
  edges.value = remainingEdges

  if (props.data.portNames) {
    delete props.data.portNames[port.id]
    delete props.data.portNames[port.internalId]
  }

  props.data.inputs.splice(index, 1)
}

function addOutputPort() {
  if (!props.data) return
  if (!Array.isArray(props.data.outputs)) {
    props.data.outputs = []
  }
  const outputBaseIds = new Set(props.data.outputs.map((p: GroupPortItem) => p.id.replace(`-${nodeId.value}`, '')))
  let baseId = 'output'
  let newId = makeHandleId('output', 'output')
  let newInternalId = makeHandleId('output', 'internal-output')
  let defaultName = 'Output'

  if (outputBaseIds.has('output')) {
    let index = 1
    while (outputBaseIds.has(`output-${index}`)) {
      index++
    }
    baseId = `output-${index}`
    newId = makeHandleId('output', baseId)
    newInternalId = makeHandleId('output', `internal-${baseId}`)
    defaultName = `Output ${index + 1}`
  }

  props.data.outputs.push({
    id: newId,
    internalId: newInternalId,
    defaultName
  })
}

function removeOutputPort(index: number) {
  if (!props.data?.outputs) return
  const port = props.data.outputs[index]
  if (!port) return

  const edgeList = edges.value as Edge[]
  const remainingEdges: Edge[] = []
  edgeList.forEach((edge) => {
    const isTargetMatch = edge.target === props.id && edge.targetHandle === port.internalId
    const isSourceMatch = edge.source === props.id && edge.sourceHandle === port.id
    if (!isTargetMatch && !isSourceMatch) {
      remainingEdges.push(edge)
    }
  })
  edges.value = remainingEdges

  if (props.data.portNames) {
    delete props.data.portNames[port.id]
    delete props.data.portNames[port.internalId]
  }

  props.data.outputs.splice(index, 1)
}

const saveStatus = ref<'idle' | 'saved'>('idle')

function handleSavePreset() {
  const currentLabel = props.data?.label || (props as any).label
  if (isDefaultGroupName(currentLabel)) {
    openNamingDialog(props.id, '')
  } else {
    saveGroupAsPreset(props.id, currentLabel)
    saveStatus.value = 'saved'
    setTimeout(() => {
      saveStatus.value = 'idle'
    }, 1500)
  }
}

function deleteNode() {
  const nodeList = nodes.value as Array<{ id: string; parentNode?: string }>
  const idsToDelete = new Set([props.id])
  let foundDescendant = true

  while (foundDescendant) {
    foundDescendant = false
    nodeList.forEach((node) => {
      if (node.parentNode && idsToDelete.has(node.parentNode) && !idsToDelete.has(node.id)) {
        idsToDelete.add(node.id)
        foundDescendant = true
      }
    })
  }

  removeNodes([...idsToDelete])
}

function onResize(event: OnResize | OnResizeEnd) {
  if (!event?.params) return
  const width = Math.round(event.params.width)
  const height = Math.round(event.params.height)

  if (props.data) {
    props.data.width = width
    props.data.height = height
  }

  const node = (nodes.value as any[]).find((n) => n.id === props.id)
  if (node) {
    node.width = width
    node.height = height
    node.style = {
      ...(node.style || {}),
      width: `${width}px`,
      height: `${height}px`
    }
  }

  const graphNode = findNode ? (findNode(props.id) as any) : null
  if (graphNode) {
    graphNode.width = width
    graphNode.height = height
  }
}

onMounted(() => {
  if (props.data) {
    if (!Array.isArray(props.data.inputs)) {
      props.data.inputs = [
        { id: 'input', internalId: 'internal-input', defaultName: 'Input' }
      ]
    }
    if (!Array.isArray(props.data.outputs)) {
      props.data.outputs = [
        { id: 'output', internalId: 'internal-output', defaultName: 'Output' }
      ]
    }
    if (!props.data.width) {
      props.data.width = (props as any).width || props.dimensions?.width || 420
    }
    if (!props.data.height) {
      props.data.height = (props as any).height || props.dimensions?.height || 260
    }
  }
})
</script>
