<template>
  <div
    ref="dialogRef"
    class="modal-backdrop decision-backdrop"
    tabindex="-1"
    @click.self="$emit('close')"
    @keydown.esc.stop="$emit('close')"
  >
    <section class="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <header class="decision-header">
        <div>
          <div class="help-eyebrow">Entscheidungshilfe</div>
          <h1 id="decision-title" class="help-title">Finde den passenden Node</h1>
        </div>
        <button class="help-close-button" type="button" aria-label="Schließen" @click="$emit('close')">
          <IconX :size="18" aria-hidden="true" />
        </button>
      </header>

      <NodeReferencePage
        v-if="selectedNodeKey"
        :node-key="selectedNodeKey"
        @back="selectedNodeKey = null"
        @add="addSelectedNode"
      />
      <div v-else class="decision-content">
        <button
          v-if="history.length"
          class="decision-back-link"
          type="button"
          @click="goBack"
        >
          ← Zurück
        </button>
        <h2 class="decision-question">{{ steps[currentStepId].question }}</h2>
        <div class="decision-options">
          <button
            v-for="option in steps[currentStepId].options"
            :key="option.label"
            class="decision-option"
            type="button"
            @click="choose(option)"
          >
            <span>
              <strong>{{ option.label }}</strong>
              <small v-if="option.description">{{ option.description }}</small>
            </span>
            <span class="decision-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { IconX } from '@tabler/icons-vue'
import NodeReferencePage from './NodeReferencePage.vue'
import type { NodeReferenceKey } from './nodeReferences'

const emit = defineEmits<{
  close: []
  addNode: [nodeKey: NodeReferenceKey]
}>()

interface DecisionOption {
  label: string
  description?: string
  next?: string
  result?: NodeReferenceKey
}

interface DecisionStep {
  question: string
  options: DecisionOption[]
}

const steps: Record<string, DecisionStep> = {
  start: {
    question: 'Was möchtest du mit deinen Daten tun?',
    options: [
      { label: 'Werte aus mehreren Spalten zusammenfügen oder gemeinsam nutzen', next: 'multiple' },
      { label: 'Zwei Werte vergleichen oder etwas überprüfen', next: 'conditions' },
      { label: 'Den Inhalt einer Spalte auf mehrere Spalten verteilen', next: 'split' },
      { label: 'Textteile finden, ändern oder festen Text einsetzen', next: 'text' },
      { label: 'Zeilen oder bestimmte Werte zählen', next: 'count' }
    ]
  },
  multiple: {
    question: 'Was möchtest du mit den Werten aus mehreren Spalten machen?',
    options: [
      { label: 'Die Werte zu einem Text verbinden', description: 'Zum Beispiel Vor- und Nachname mit einem Leerzeichen.', result: 'combineStrings' },
      { label: 'Je nach Inhalt der Zeile einen passenden Wert auswählen', next: 'rowChoice' }
    ]
  },
  rowChoice: {
    question: 'Wie soll der passende Wert ausgewählt werden?',
    options: [
      { label: 'Den ersten ausgefüllten Wert verwenden', description: 'Zum Beispiel Handynummer, sonst Festnetz; optional mit einem Ersatzwert.', result: 'coalesce' },
      { label: 'Je nach Ergebnis einer Prüfung einen von zwei Werten wählen', description: 'Zum Beispiel: Wenn der Wert passt, nimm A, sonst nimm B.', result: 'if' },
      { label: 'Zählen, wie oft ein Wert oder eine Wertekombination vorkommt', result: 'uniqueCount' }
    ]
  },
  conditions: {
    question: 'Was möchtest du überprüfen?',
    options: [
      { label: 'Prüfen, ob zwei Werte gleich sind oder sich unterscheiden', description: 'Das Ergebnis ist „Ja“ oder „Nein“.', result: 'compare' },
      { label: 'Je nachdem, ob ein Wert vorhanden ist, einen Wert auswählen', description: 'Ein Wert wird genutzt, wenn etwas da ist, ein anderer, wenn nicht.', result: 'if' }
    ]
  },
  split: {
    question: 'Woran erkennst du, wo der Inhalt getrennt werden soll?',
    options: [
      { label: 'An einem bestimmten Zeichen oder Text', description: 'Zum Beispiel „Rot|Grün|Blau“ an den senkrechten Strichen.', result: 'splitString' },
      { label: 'Anhand bestimmter Muster im Text', description: 'Zum Beispiel verschiedene Textteile gezielt heraussuchen.', result: 'regex' }
    ]
  },
  text: {
    question: 'Was möchtest du mit dem Text machen?',
    options: [
      { label: 'Einen bestimmten Teil finden, herauslösen oder ersetzen', description: 'Zum Beispiel eine Nummer oder einen Code aus einem Text holen.', result: 'regex' },
      { label: 'In jeder Zeile denselben festen Text einsetzen', description: 'Zum Beispiel ein Etikett oder einen Ersatzwert.', result: 'string' }
    ]
  },
  count: {
    question: 'Welche Nummer oder Anzahl brauchst du?',
    options: [
      { label: 'Jeder Zeile die nächste Nummer geben', description: 'Du kannst die erste Nummer und die Sprünge zwischen Nummern festlegen.', result: 'counter' },
      { label: 'Zählen, wie oft ein Wert oder eine Kombination vorkommt', result: 'uniqueCount' }
    ]
  }
}

const currentStepId = ref('start')
const history = ref<string[]>([])
const selectedNodeKey = ref<NodeReferenceKey | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

function addSelectedNode() {
  if (selectedNodeKey.value) emit('addNode', selectedNodeKey.value)
}

onMounted(() => {
  nextTick(() => dialogRef.value?.focus())
})

function choose(option: DecisionOption) {
  if (option.result) {
    selectedNodeKey.value = option.result
    return
  }

  if (option.next) {
    history.value.push(currentStepId.value)
    currentStepId.value = option.next
  }
}

function goBack() {
  currentStepId.value = history.value.pop() ?? 'start'
}
</script>