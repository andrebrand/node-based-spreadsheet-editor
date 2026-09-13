<template>
  <div class="node-menu" v-if="options.icon || options.label">
    <button class="node-menu-toggle" type="button" :aria-expanded="isOpen" @click="toggleMenu()">
      <component
          v-if="options.icon"
          :is="options.icon"
          class="btn-icon"
          :size="15"
      />
      <span v-if="options.label">{{options.label}}</span>
      <span class="menu-chevron" :class="{ open: isOpen }" aria-hidden="true"></span>
    </button>
    <div class="node-menu-items" v-if="isOpen">
      <button v-for="item of items" @click="emit('itemClicked', item.value); closeMenu()">
        <component
            v-if="item.icon"
            :is="item.icon"
            class="btn-icon"
            :size="18"
        />
        <span v-if="item.label">
          {{item.label}}
        </span>
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import type { Icon } from '@tabler/icons-vue'


type ButtonOption = {
  icon?: Icon,
  label?: string
}
type DropDownItems = {
  icon?: Icon,
  label?: string,
  value: string
}

const props = defineProps<{
  options: ButtonOption,
  items: DropDownItems[]
}>()

const emit = defineEmits<{
  itemClicked: [string]
}>()

const isOpen = defineModel<boolean>();

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
}

const closeMenu = () => {
  isOpen.value = false;
}
</script>

<style scoped>
.node-menu-toggle { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 0; background: var(--primary-color); color: var(--primary-text-color); border-radius: 4px; cursor: pointer; }
.node-menu-toggle:hover {
  background: var(--primary-dark);
}

.node-menu { display: inline-block; position: relative; margin-right: 6px; }
.menu-chevron { width: 7px; height: 7px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg) translateY(-2px); transition: transform 0.15s ease; }
.menu-chevron.open { transform: rotate(225deg) translate(-1px, -1px); }

.node-menu-items { position: absolute; top: calc(100% + 4px); left: 0; min-width: 200px; padding: 4px; background: var(--background-color); border: 1px solid var(--border-color); border-radius: 5px; box-shadow: var(--box-shadow); }
.node-menu-items button { display: flex; justify-content: start; width: 100%; gap:6px; align-items: center; padding: 7px 9px; border: 0; border-radius: 3px; background: transparent; color: var(--text-color); cursor: pointer; }
.node-menu-items button:hover { background: var(--background-highlight) }

</style>
