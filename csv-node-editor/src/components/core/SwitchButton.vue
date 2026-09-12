<template>
    <div class="button-wrapper">
        <button v-for="option of options" :key="option.value"
            type="button"
            :title="option.title"
            @click="handleChange(option.value)"
            :class="model === option.value ? 'active' : ''"
        >
        <component 
        :is="option.icon"
        class="btn-icon" 
        :size="20" 
        />
        </button>
    </div>
</template>


<script setup lang="ts">
import type { Icon } from '@tabler/icons-vue'
import { ref, type Ref } from 'vue'


type ButtonOption = {
    title?: string
    value: string
    icon: Icon
}


const model = defineModel();

const props = defineProps<{
    options: ButtonOption[]
}>()

const emit = defineEmits<{
  change: [string]
}>()

const handleChange = (value: string) => {
    if (value !== model.value) {
        model.value = value
        emit('change', value)
    }
}
</script>

<style scoped>
.button-wrapper{
    display: flex;
}
.button-wrapper button{
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px 7px; 
    border: 0; 
    background: #2563eb; 
    color: white; 
    border-radius: 4px;
    cursor: pointer;
}

.button-wrapper button:hover:not(.active) {
    background: #1d4ed8; 
}


.button-wrapper button.active {
    background-color: #789ae4;
    color: #fff; 
    cursor:unset;
}

.button-wrapper button:first-child{
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.button-wrapper button:last-child{
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

</style>
