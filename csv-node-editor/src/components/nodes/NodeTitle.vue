<template>
  <div :class="headerClass || 'node-header'">
    <input
      v-if="editing"
      v-model="draft"
      class="node-title-input nodrag"
      type="text"
      @click.stop
      @keydown.enter.prevent="save"
      @keydown.escape.prevent="cancel"
      @blur="save"
    />
    <span v-else class="node-title-text" @dblclick.stop="startEdit">
      {{ label || defaultLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label?: string
  defaultLabel: string
  headerClass?: string
}>()

const emit = defineEmits<{
  'update:label': [value: string]
}>()

const editing = ref(false)
const draft = ref('')

function startEdit() {
  draft.value = props.label || props.defaultLabel
  editing.value = true
}

function save() {
  if (!editing.value) return
  const value = draft.value.trim()
  if (value) emit('update:label', value)
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>
