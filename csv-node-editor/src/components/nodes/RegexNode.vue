<template>
  <div class="custom-node transform-node">
    <NodeTitle v-model:label="data.label" default-label="💫 RegEx Node" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <span>Input</span>
      </div>

      <div class="controls">
        <label>Mode:</label>
        <select v-model="data.mode" class="nodrag">
          <option value="match">Filter Match</option>
          <option value="replace">Replace</option>
        </select>

        <label>Regex Pattern:</label>
        <input class="nodrag" type="text" v-model="data.pattern" placeholder="z.B. \d+" />

        <div class="flags-wrapper">
          <div class="flags-actions">
            <label>Flags:</label>
            <div class="flags-bar nodrag">
              <button
                v-for="item in availableFlags"
                :key="item.flag"
                type="button"
                class="flag-btn nodrag"
                :class="{ active: hasFlag(item.flag) }"
                :title="item.title"
                @click="toggleFlag(item.flag)"
              >
                {{ item.flag }}
              </button>
            </div>
          </div>
          <span class="flags-preview">/{{ currentFlags }}</span>
        </div>


        <template v-if="data.mode === 'replace'">
          <label>Replacement text:</label>
          <input class="nodrag" type="text" v-model="data.replacement" placeholder="Replacement..." />
        </template>
      </div>

      <div class="port-row right">
        <span>Output</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'

const props = defineProps<NodeProps<{
  pattern: string
  replacement: string
  mode: 'match' | 'replace'
  flags?: string
  label?: string
}>>()

const { removeNodes } = useVueFlow()

const availableFlags = [
  { flag: 'i', title: 'Case Insensitive' }
]

const currentFlags = computed(() => {
  return props.data.flags || ''
})

function hasFlag(flag: string): boolean {
  return currentFlags.value.includes(flag)
}

function toggleFlag(flag: string) {
  const current = currentFlags.value
  let updated: string
  if (current.includes(flag)) {
    updated = current.replaceAll(flag, '')
  } else {
    const combined = current + flag
    updated = availableFlags
      .map((item) => item.flag)
      .filter((f) => combined.includes(f))
      .join('')
  }
  props.data.flags = updated
}

function deleteNode() {
  removeNodes([props.id])
}
</script>

<style scoped>
.flags-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
}

.flags-preview {
  color: #2563eb;
  font-weight: 600;
  font-size: 11px;
}

.flags-bar {
  display: flex;
  gap: 4px;
}

.flag-btn {
  padding: 3px;
  width: 15px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}
.flags-actions{
  display: flex;
  gap: 3px;
  align-content: center;
}
.flags-actions label{
  padding-top: 3px;
}

.flag-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.flag-btn.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: white;
}
</style>