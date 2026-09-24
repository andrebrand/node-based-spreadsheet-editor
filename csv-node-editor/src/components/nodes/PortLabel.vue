<template>
  <div class="port-label nodrag" @dblclick.stop="startEdit">
    <input
      v-if="editing"
      ref="inputRef"
      v-model="draft"
      class="port-label-input nodrag"
      type="text"
      @click.stop
      @mousedown.stop
      @pointerdown.stop
      @keydown.enter.prevent="save"
      @keydown.escape.prevent="cancel"
      @blur="save"
    />
    <span
      v-else
      class="port-label-text nodrag"
      title="Double-click to rename"
    >
      {{ name || defaultName }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  name?: string
  defaultName: string
}>()

const emit = defineEmits<{
  'update:name': [value: string]
}>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  draft.value = props.name || props.defaultName
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function save() {
  if (!editing.value) return
  const val = draft.value.trim()
  emit('update:name', val)
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>

<style scoped>
.port-label {
  display: inline-flex;
  align-items: center;
  user-select: none;
}

.port-label-text {
  cursor: text;
  font-size: 11px;
}

.port-label-input {
  width: 100px;
  max-width: 130px;
  padding: 1px 4px;
  border: 1px solid #93c5fd;
  border-radius: 3px;
  font-size: 11px;
  height: 18px;
  outline: none;
  background: white;
  box-sizing: border-box;
}
</style>

