<template>
  <div class="table-preview">
    <h3>Dynamische Ausgabetabelle</h3>
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
      Verbinde Spalten vom Input zum Output, um Ergebnisse zu sehen.
    </div>
  </div>
</template>

<script setup lang="ts">
import { outputTable } from '../composables/usePipeline'
</script>