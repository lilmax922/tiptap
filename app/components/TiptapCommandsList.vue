<script setup lang="ts">
const { items, command } = defineProps<{
  items: any[],
  command: Function,
}>()

const selectedIndex = ref(0)

watch(() => items, () => {
  selectedIndex.value = 0
})

function selectItem(index: number) {
  selectedIndex.value = index
  command(items[index])
}

function onKeyDown(event: KeyboardEvent) {
  if (items.length === 0)
    return false

  if (event.key === 'ArrowUp') {
    selectedIndex.value = ((selectedIndex.value + items.length) - 1) % items.length
    return true
  }
  else if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % items.length
    return true
  }
  else if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }

  return false
}

defineExpose({
  onKeyDown,
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto">
    <button
      v-for="(item, index) in items"
      :key="index"
      :class="[
        'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150',
        { 'bg-gray-100': index === selectedIndex }
      ]"
      @click="selectItem(index)"
    >
      <div class="font-medium text-gray-800">{{ item.title }}</div>
    </button>
  </div>
</template>
