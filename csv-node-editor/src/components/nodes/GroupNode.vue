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

    <div class="group-port outer-input">
      <Handle id="input" type="target" :position="Position.Left" />
      <PortLabel
        :name="data.portNames?.['input']"
        default-name="Input"
        @update:name="setPortName('input', $event)"
      />
    </div>

    <div class="group-port inner-input">
      <PortLabel
        :name="data.portNames?.['internal-input']"
        default-name="|"
        @update:name="setPortName('internal-input', $event)"
      />
      <Handle id="internal-input" type="source" :position="Position.Right" />
    </div>

    <div class="group-port inner-output">
      <Handle id="internal-output" type="target" :position="Position.Left" />
      <PortLabel
        :name="data.portNames?.['internal-output']"
        default-name="|"
        @update:name="setPortName('internal-output', $event)"
      />
    </div>

    <div class="group-port outer-output">
      <PortLabel
        :name="data.portNames?.['output']"
        default-name="Output"
        @update:name="setPortName('output', $event)"
      />
      <Handle id="output" type="source" :position="Position.Right" />
    </div>

    <button class="delete-node-btn group-delete-btn nodrag" type="button" @click="deleteNode">Delete node</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { OnResize, OnResizeEnd } from '@vue-flow/node-resizer'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'
import PortLabel from './PortLabel.vue'
import { nodes } from '../../composables/usePipeline'
import { isDefaultGroupName, openNamingDialog, saveGroupAsPreset } from '../../composables/usePresets'
import { setNodePortName } from '../../composables/usePortNames'

const props = defineProps<NodeProps<{ label?: string; width?: number; height?: number; portNames?: Record<string, string> }>>()

const { removeNodes, findNode } = useVueFlow()

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
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
  removeNodes([props.id])
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
    if (!props.data.width) {
      props.data.width = (props as any).width || props.dimensions?.width || 420
    }
    if (!props.data.height) {
      props.data.height = (props as any).height || props.dimensions?.height || 260
    }
  }
})
</script>
