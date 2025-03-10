<template>
  <div class="border border-gray-300 rounded-lg p-4">
    <EditorContent :editor="editor" class="prose" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    Mention
      .extend({ name: 'command' })
      .configure({
        suggestion: TiptapCommandSuggestion
      })
  ],
  autofocus: true,
  editable: true,
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>