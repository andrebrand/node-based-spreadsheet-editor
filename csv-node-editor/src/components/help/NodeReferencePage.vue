<template>
  <article class="node-reference-page">
    <div class="reference-topbar">
      <button class="help-back-button" type="button" @click="$emit('back')">
        <IconArrowLeft :size="16" aria-hidden="true" />
        <span>Zurück zur Entscheidung</span>
      </button>
      <div class="help-eyebrow">Baustein-Erklärung</div>
    </div>
    <h2 class="help-title">{{ reference.title }}</h2>
    <p class="help-summary">{{ reference.summary }}</p>

    <section class="reference-section">
      <h3>Wofür ist dieser Baustein da?</h3>
      <p>{{ reference.useCase }}</p>
    </section>

    <div class="reference-io">
      <section class="reference-section">
        <h3>Was kommt hinein?</h3>
        <ul>
          <li v-for="input in reference.inputs" :key="input">{{ input }}</li>
        </ul>
      </section>
      <section class="reference-section">
        <h3>Was kommt heraus?</h3>
        <ul>
          <li v-for="output in reference.outputs" :key="output">{{ output }}</li>
        </ul>
      </section>
    </div>

    <p v-if="reference.note" class="reference-note">{{ reference.note }}</p>
    <div class="reference-actions">
      <button class="help-add-button" type="button" @click="$emit('add')">
        {{ reference.title }} zum Canvas hinzufügen
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowLeft } from '@tabler/icons-vue'
import { nodeReferences, type NodeReferenceKey } from './nodeReferences'

const props = defineProps<{ nodeKey: NodeReferenceKey }>()
defineEmits<{
  back: []
  add: []
}>()

const reference = computed(() => nodeReferences[props.nodeKey])
</script>