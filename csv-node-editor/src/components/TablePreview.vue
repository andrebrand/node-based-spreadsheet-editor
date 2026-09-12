<template>
  <div class="table-preview">
    <div class="table-preview-header">
      <div class="table-preview-title-group">
        <h3>Preview table</h3>
      </div>
      <div class="table-preview-actions">
        <div v-if="outputTable.headers.length" class="download-buttons">
          <button class="download-csv-btn" type="button" @click="downloadCsv">
            Download CSV
          </button>
          <button class="download-excel-btn" type="button" @click="downloadExcel">
            Download Excel
          </button>
        </div>
        <button
          class="layout-toggle-btn"
          type="button"
          :title="position === 'bottom' ? 'Dock preview to right side' : 'Dock preview to bottom'"
          @click="$emit('toggle-position')"
        >
          <span v-if="position === 'bottom'">⬌ Dock Right</span>
          <span v-else>⬍ Dock Bottom</span>
        </button>
      </div>
    </div>
    <div class="table-wrapper" v-if="outputTable.headers.length">
      <table>
        <thead>
          <tr>
            <th v-for="header in outputTable.headers" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in outputTable.rows" :key="i">
            <td v-for="header in outputTable.headers" :key="header">{{ row[header] }}</td>
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
import { outputTable } from '../composables/usePipeline'

withDefaults(
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

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
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
  link.download = 'output.csv'
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
  link.download = 'output.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
</script>