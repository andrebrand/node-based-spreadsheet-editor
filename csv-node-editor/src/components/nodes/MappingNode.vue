<template>
  <div class="custom-node mapping-node">
    <NodeTitle :label="data.label" default-label="🗺 Mapping Node" @update:label="data.label = $event" />
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <PortLabel
          :name="data.portNames?.input"
          default-name="Input"
          @update:name="setPortName('input', $event)"
        />
      </div>

      <div class="mapping-pairs">
        <button class="small-node-btn nodrag" type="button" @click="swapPairs">
          Swap keys and values
        </button>
        <div class="mapping-pair-list">
          <div v-for="(pair, index) in data.pairs" :key="index" class="mapping-pair">
            <input
              v-model="pair.key"
              class="nodrag"
              type="text"
              :aria-label="`Key ${index + 1}`"
              placeholder="Key"
              @paste="handlePairPaste(index, $event)"
            />
            <input
              v-model="pair.value"
              class="nodrag"
              type="text"
              :aria-label="`Value ${index + 1}`"
              placeholder="Value"
            />
            <button
              class="mapping-remove-btn nodrag"
              type="button"
              :aria-label="`Remove pair ${index + 1}`"
              title="Remove pair"
              @click="removePair(index)"
            >
              ×
            </button>
          </div>
        </div>
        <button class="small-node-btn nodrag" type="button" @click="addPair">+ Pair</button>
      </div>

      <label class="mapping-case-option">
        <input v-model="data.caseInsensitive" class="nodrag" type="checkbox" />
        Case insensitive
      </label>

      <div class="port-row right">
        <PortLabel
          :name="data.portNames?.output"
          default-name="Output"
          @update:name="setPortName('output', $event)"
        />
        <Handle id="output" type="source" :position="Position.Right" />
      </div>

      <button class="delete-node-btn nodrag" type="button" @click="deleteNode">Delete node</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import NodeTitle from './NodeTitle.vue'
import PortLabel from './PortLabel.vue'
import { setNodePortName } from '../../composables/usePortNames'

interface MappingPair {
  key: string
  value: string
}

const props = defineProps<NodeProps<{
  pairs: MappingPair[]
  caseInsensitive: boolean
  label?: string
  portNames?: Record<string, string>
}>>()

const { removeNodes } = useVueFlow()

function setPortName(portId: string, name: string) {
  setNodePortName(props.data, portId, name)
}

function addPair() {
  props.data.pairs.push({ key: '', value: '' })
}

function handlePairPaste(index: number, event: ClipboardEvent) {
  const input = event.currentTarget as HTMLInputElement
  if (input.value !== '') return

  const pastedPairs = parsePastedPairs(event.clipboardData?.getData('text/plain') ?? '')
  if (!pastedPairs) return

  event.preventDefault()
  props.data.pairs.splice(index, props.data.pairs.length - index, ...pastedPairs)
}

function parsePastedPairs(text: string): MappingPair[] | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  if (lines.length < 2) return null

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : null
  if (!delimiter) return null

  const pairs: MappingPair[] = []
  for (const line of lines) {
    const cells = line.split(delimiter)
    if (cells.length !== 2 || cells[0] === '') return null
    pairs.push({ key: cells[0], value: cells[1] })
  }
  return pairs
}

function removePair(index: number) {
  if (props.data.pairs.length <= 1) {
    props.data.pairs[index] = { key: '', value: '' }
    return
  }
  props.data.pairs.splice(index, 1)
}

function swapPairs() {
  props.data.pairs = props.data.pairs.map(({ key, value }) => ({ key: value, value: key }))
}

function deleteNode() {
  removeNodes([props.id])
}
</script>

<style scoped>
.mapping-node {
  display: flex;
  flex-direction: column;
  max-height: 500px;
  min-height: 0;
  overflow: hidden;
}

.mapping-node > .node-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.mapping-node > .node-body > :not(.mapping-pairs) {
  flex: 0 0 auto;
}

.mapping-case-option {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  font-size: 11px;
}

.mapping-pairs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0;
  min-height: 0;
}

.mapping-pair-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
}

.mapping-pair {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 20px;
  gap: 4px;
}

.mapping-pair input {
  min-width: 0;
  width: 100%;
  padding: 4px;
  font-size: 11px;
}

.mapping-remove-btn {
  border: 0;
  background: transparent;
  color: #b91c1c;
  cursor: pointer;
  font-size: 16px;
}
</style>