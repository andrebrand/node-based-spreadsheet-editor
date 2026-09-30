<template>
  <div class="custom-node input-node">
    <div class="node-header input-node-header">
      <button
        class="output-pin-btn input-preview-toggle nodrag"
        :class="{ active: previewSource === 'input' }"
        type="button"
        :title="previewSource === 'input' ? 'Show output preview' : 'Show input preview'"
        :aria-label="previewSource === 'input' ? 'Show output preview' : 'Show input preview'"
        :aria-pressed="previewSource === 'input'"
        @click.stop="togglePreviewSource"
      >
        <IconEye :size="16" aria-hidden="true" />
      </button>
      <span>📥 Input: {{ data.fileName || 'No file' }}</span>
    </div>
    <div class="node-body">
      <div v-for="header in data.headers" :key="header" class="port-row right">
        <PortLabel
          :name="data.portNames?.[header]"
          :default-name="header"
          @update:name="setPortName(header, $event)"
        />
        <Handle :id="header" type="source" :position="Position.Right" />
      </div>
      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { IconEye } from '@tabler/icons-vue'
import type { NodeProps } from '@vue-flow/core'
import PortLabel from './PortLabel.vue'
import { previewSource } from '../../composables/usePipeline'
import { setNodePortName } from '../../composables/usePortNames'

const props = defineProps<NodeProps<{
  fileName: string
  headers: string[]
  onDelete: () => void
  portNames?: Record<string, string>
}>>()

function setPortName(portId: string, newName: string) {
  setNodePortName(props.data, portId, newName)
}

function deleteNode() {
  props.data.onDelete()
}

function togglePreviewSource() {
  previewSource.value = previewSource.value === 'input' ? 'output' : 'input'
}
</script>