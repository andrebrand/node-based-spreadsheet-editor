<template>
  <div class="table-preview">
    <div class="table-preview-header">
      <div class="table-preview-title-group">
        <h3>{{ previewSource === 'input' ? 'Input preview' : 'Output preview' }}</h3>
      </div>
      <div class="table-preview-actions">
        <div v-if="previewSource === 'output' && outputTable.headers.length" class="download-buttons">
          <button class="download-csv-btn" type="button" @click="downloadCsv">
            Download CSV
          </button>
          <button class="download-excel-btn" type="button" @click="downloadExcel">
            Download Excel
          </button>
        </div>

        <SwitchButton v-model="props.position" :options="[{
          title: 'Display the preview on the right side',
          icon: IconLayoutSidebarRightInactive,
          value: 'right'
        },{
          title: 'Display the preview on the bottom',
          icon: IconLayoutBottombarInactive,
          value: 'bottom'
        }]" @change="$emit('toggle-position')" />
      </div>
    </div>
    <div class="table-wrapper" v-if="previewTable.headers.length">
      <table>
        <thead>
          <tr>
            <th v-for="header in previewTable.headers" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in previewTable.rows" :key="i">
            <td
              v-for="header in previewTable.headers"
              :key="header"
              @dblclick.stop="previewSource === 'input' && startEditingCell(i, header, row[header])"
            >
              <input
                v-if="isEditingCell(i, header)"
                ref="editingInput"
                class="table-cell-input"
                type="text"
                :aria-label="`Row ${i + 1}, ${header}`"
                :value="editingValue"
                @input="setEditingValue($event)"
                @blur="commitInputCell"
                @keydown.enter.prevent="commitInputCell"
                @keydown.esc.prevent="cancelInputCell"
              />
              <template v-else>{{ row[header] }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      Upload a CSV- or Excel-file to see the preview.
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import { computed, nextTick, ref, watch } from 'vue'
import { outputTable, previewSource, rawData } from '../composables/usePipeline'
import SwitchButton from './core/SwitchButton.vue'
import { IconLayoutSidebarRightInactive, IconLayoutBottombarInactive } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    position?: 'right' | 'bottom'
  }>(),
  {
    position: 'right'
  }
)

defineEmits<{
  (e: 'toggle-position'): void
}>()

const previewTable = computed(() => previewSource.value === 'input'
  ? { headers: rawData.value.headers, rows: rawData.value.rows }
  : outputTable.value
)

const editingCell = ref<{ rowIndex: number; header: string } | null>(null)
const editingValue = ref('')
const editingInput = ref<HTMLInputElement | null>(null)

function isEditingCell(rowIndex: number, header: string) {
  return editingCell.value?.rowIndex === rowIndex && editingCell.value?.header === header
}

function startEditingCell(rowIndex: number, header: string, value: unknown) {
  editingCell.value = { rowIndex, header }
  editingValue.value = String(value ?? '')
  void nextTick(() => editingInput.value?.focus())
}

function setEditingValue(event: Event) {
  editingValue.value = (event.target as HTMLInputElement).value
}

function commitInputCell() {
  const cell = editingCell.value
  if (!cell) return

  editingCell.value = null
  if (String(rawData.value.rows[cell.rowIndex]?.[cell.header] ?? '') === editingValue.value) return

  rawData.value = {
    ...rawData.value,
    rows: rawData.value.rows.map((row, index) => (
      index === cell.rowIndex ? { ...row, [cell.header]: editingValue.value } : row
    ))
  }
}

function cancelInputCell() {
  editingCell.value = null
}

watch(previewSource, cancelInputCell)

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function getExportBaseName() {
  return rawData.value.fileName.replace(/\.[^.]+$/, '') || 'output'
}

function downloadCsv() {
  const headerRow = outputTable.value.headers.map(escapeCsvValue).join(',')
  const dataRows = outputTable.value.rows.map((row) => (
    outputTable.value.headers.map((header) => escapeCsvValue(row[header])).join(',')
  ))
  const csv = [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${getExportBaseName()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function downloadExcel() {
  const rows = outputTable.value.rows.map((row) => {
    const orderedRow: Record<string, unknown> = {}
    outputTable.value.headers.forEach((header) => {
      orderedRow[header] = row[header] ?? ''
    })
    return orderedRow
  })
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: outputTable.value.headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Output')
  const workbookData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([workbookData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${getExportBaseName()}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
</script>