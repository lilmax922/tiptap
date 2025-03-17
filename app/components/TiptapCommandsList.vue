<script setup lang="ts">
const props = defineProps<{
  items: Command[]
  command: CommandHandler<unknown>
}>()

const isImageDialogOpen = ref(false)

const selectedIndex = ref(0)

function selectItem(index: number) {
  const item = props.items[index]
  selectedIndex.value = index
  if (item?.type === 'option') {
    if (item.id === 'image') {
      isImageDialogOpen.value = true
      toggleSuggestionTippyPopup(!isImageDialogOpen.value)
      return
    }
    props.command(item.action)
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (props.items.length === 0)
    return false

  if (event.key === 'ArrowUp') {
    selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length
    return true
  }
  else if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
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
  <div class="max-h-80 max-w-40 overflow-hidden overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
    <template
      v-for="(item, index) in items"
      :key="item.name"
    >
      <Label
        v-if="item.type === 'category'"
        class="px-4 text-sm font-medium text-gray03"
      >
        {{ item.name }}
      </Label>
      <button
        v-else
        class="inline-flex w-full items-center gap-2 px-4 py-2 text-left font-medium text-gray-800 transition-colors duration-150 hover:bg-gray-100"
        :class="{ 'bg-gray-100': index === selectedIndex }"
        @click="selectItem(index)"
      >
        <!-- @click="item.id !== 'image' ? selectItem(index): null" -->
        <template v-if="item.id !== 'image'">
          <component
            :is="item.icon"
            class="size-5"
          />
          {{ item.name }}
        </template>
        <ImagePickerDialog
          v-else
          v-model:open="isImageDialogOpen"
        >
          <template #trigger>
            <div class="inline-flex items-center gap-2">
              <component
                :is="item.icon"
                class="size-5"
              />
              {{ item.name }}
            </div>
          </template>
        </ImagePickerDialog>
      </button>
    </template>
  </div>
</template>
