<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3'
import {
  Bold,
  Italic,
  Underline,
} from 'lucide-vue-next'

const props = defineProps<{
  editor: Editor
}>()

const formatButtons = [
  { name: 'bold', icon: Bold, action: () => props.editor.chain().focus().toggleBold().run() },
  { name: 'underline', icon: Underline, action: () => props.editor.chain().focus().toggleUnderline().run() },
  { name: 'italic', icon: Italic, action: () => props.editor.chain().focus().toggleItalic().run() },
]
</script>

<template>
  <BubbleMenu
    :editor="editor"
    class="rounded-md border bg-white p-1 shadow-sm"
  >
    <div class="flex items-center gap-1">
      <button
        v-for="btn in formatButtons"
        :key="btn.name"
        variant="ghost"
        size="icon"
        class="size-8 text-black"
        :class="{ 'bg-gray-100': props.editor.isActive(btn.name) }"
        @click="btn.action"
      >
        <component
          :is="btn.icon"
          class="size-5"
        />
      </button>
    </div>
  </BubbleMenu>
</template>
