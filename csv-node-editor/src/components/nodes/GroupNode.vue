<template>
  <div class="group-node">
    <NodeResizer :min-width="280" :min-height="180" />
    <div class="group-node-header">Group Node</div>

    <div class="group-port outer-input">
      <Handle id="input" type="target" :position="Position.Left" />
      <span>Input</span>
    </div>

    <div class="group-port inner-input">
      <span>Interner Input</span>
      <Handle id="internal-input" type="source" :position="Position.Left" />
    </div>

    <div class="group-port inner-output">
      <Handle id="internal-output" type="target" :position="Position.Right" />
      <span>Interner Output</span>
    </div>

    <div class="group-port outer-output">
      <span>Output</span>
      <Handle id="output" type="source" :position="Position.Right" />
    </div>

    <button class="delete-node-btn group-delete-btn" type="button" @click="deleteNode">Node löschen</button>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps<Record<string, never>>>()

const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([props.id])
}
</script>
