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

    <section
      v-for="(example, exampleIndex) in examples"
      :key="exampleIndex"
      class="reference-example"
      :aria-labelledby="'reference-example-title-' + exampleIndex"
    >
      <div class="example-heading">
        <div>
          <span class="example-kicker">In der Praxis</span>
          <h3 :id="'reference-example-title-' + exampleIndex">
            {{ examples.length > 1 ? 'Beispiel ' + (exampleIndex + 1) : 'Beispiel' }}
          </h3>
        </div>
      </div>
      <p v-if="example.detail" class="example-detail">{{ example.detail }}</p>
      <div class="example-flow">
        <div class="example-stage">
          <h4>{{ example.inputTitle ?? 'Eingabe' }}</h4>
          <div class="example-table-wrap">
            <table class="example-table">
              <thead>
                <tr>
                  <th v-for="header in example.inputHeaders" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in example.inputRows" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <span v-if="cell">{{ cell }}</span>
                    <em v-else>leer</em>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <IconArrowRight class="example-arrow" :size="18" aria-hidden="true" />
        <div class="example-stage example-result">
          <h4>Ergebnis</h4>
          <div class="example-table-wrap">
            <table class="example-table">
              <thead>
                <tr>
                  <th v-for="header in example.outputHeaders" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in example.outputRows" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="example-actions">
        <button class="help-example-button" type="button" @click="$emit('openExample', props.nodeKey, exampleIndex)">
          Beispiel im Canvas öffnen
        </button>
      </div>
    </section>

    <div class="reference-actions">
      <button class="help-add-button" type="button" @click="$emit('add')">
        {{ reference.title }} hinzufügen
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-vue'
import { nodeReferences, type NodeReferenceKey } from './nodeReferences'

const props = defineProps<{ nodeKey: NodeReferenceKey }>()
defineEmits<{
  back: []
  add: []
  openExample: [nodeKey: NodeReferenceKey, exampleIndex: number]
}>()

const reference = computed(() => nodeReferences[props.nodeKey])
const examples = computed(() => [
  reference.value.example,
  ...(reference.value.additionalExamples ?? [])
])
</script>