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
      <span>Input</span>
    </div>

    <div class="group-port inner-input">
      <span>|</span>
      <Handle id="internal-input" type="source" :position="Position.Right" />
    </div>

    <div class="group-port inner-output">
      <Handle id="internal-output" type="target" :position="Position.Left" />
      <span>|</span>
    </div>

    <div class="group-port outer-output">
      <span>Output</span>
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
import { nodes } from '../../composables/usePipeline'
import { isDefaultGroupName, openNamingDialog, saveGroupAsPreset } from '../../composables/usePresets'

const props = defineProps<NodeProps<{ label?: string; width?: number; height?: number }>>()

const { removeNodes, findNode } = useVueFlow()

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
