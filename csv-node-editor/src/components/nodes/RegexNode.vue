<template>
  <div class="custom-node transform-node">
    <div class="node-header">⚡ RegEx Bearbeitung</div>
    <div class="node-body">
      <div class="port-row left">
        <Handle id="input" type="target" :position="Position.Left" />
        <span>Eingabe</span>
      </div>

      <div class="controls">
        <label>Modus:</label>
        <select v-model="data.mode">
          <option value="match">Match filtern</option>
          <option value="replace">Ersetzen</option>
        </select>

        <label>Regex Pattern:</label>
        <input type="text" v-model="data.pattern" placeholder="z.B. \d+" />

        <template v-if="data.mode === 'replace'">
          <label>Ersatz-Text:</label>
          <input type="text" v-model="data.replacement" placeholder="Ersatz..." />
        </template>
      </div>

      <div class="port-row right">
        <span>Ergebnis</span>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps<{
  pattern: string
  replacement: string
  mode: 'match' | 'replace'
  flags: string
}>>()
</script>