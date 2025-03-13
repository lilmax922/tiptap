<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'

const editorContent = ref('')
const placeholder = ref('Type something...')

const { editor } = useTiptap({
  content: computed({
    get: () => editorContent.value,
    set: (newVal) => {
      editorContent.value = newVal
    },
  }),
  placeholder: computed(() => placeholder.value),
})
</script>

<template>
  <ClientOnly v-if="editor">
    <TiptapBubbleMenu :editor />
    <EditorContent
      :editor="editor"
      class="prose"
    />
  </ClientOnly>
</template>
