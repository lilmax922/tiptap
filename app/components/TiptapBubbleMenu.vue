<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3'
import {
  Bold,
  Italic,
  Link,
  Strikethrough,
  Underline,
} from 'lucide-vue-next'

interface TextItem {
  id: string
  isActive: boolean
  action: (url?: string, inNewTab?: boolean) => void
  icon: Component
}

const props = defineProps<{ editor: Editor }>()

const linkUrl = ref('')

const TextMenu = computed<TextItem[]>(() => [
  {
    id: 'bold',
    isActive: props.editor.isActive('bold'),
    action: () => props.editor.chain().focus().toggleBold().run(),
    icon: Bold,
  },
  {
    id: 'italic',
    isActive: props.editor.isActive('italic'),
    action: () => props.editor.chain().focus().toggleItalic().run(),
    icon: Italic,
  },
  {
    id: 'underline',
    isActive: props.editor.isActive('underline'),
    action: () => props.editor.chain().focus().toggleUnderline().run(),
    icon: Underline,
  },
  {
    id: 'strike',
    isActive: props.editor.isActive('strike'),
    action: () => props.editor.chain().focus().toggleStrike().run(),
    icon: Strikethrough,
  },
  {
    id: 'link',
    isActive: props.editor.isActive('link'),
    action: (url?: string, inNewTab?: boolean) => {
      if (!url) {
        props.editor.chain().focus().unsetLink().run()
      }
      else {
        props.editor
          .chain()
          .focus()
          .setLink({ href: url, target: inNewTab ? '_blank' : '' })
          .run()
      }
    },
    icon: Link,
  },
])
</script>

<template>
  <BubbleMenu
    :editor="editor"
    class="rounded-lg border bg-white p-1 shadow-sm"
  >
    <div class="flex items-center gap-1 divide-x *:px-1 first:*:px-0 last:*:pr-0">
      <TiptapBubbleTextMenu :editor />
      <div>
        <Button
          v-for="text in TextMenu"
          :key="text.id"
          variant="ghost"
          size="icon"
          :class="{ 'bg-gray-100': text.isActive }"
          @click="text.id !== 'link' ? text.action() : null"
        >
          <component
            :is="text.icon"
            v-if="text.id !== 'link'"
            class="size-5"
          />
          <Popover v-else>
            <PopoverTrigger>
              <component
                :is="text.icon"
                class="size-5"
              />
            </PopoverTrigger>
            <PopoverContent class="flex flex-col gap-2">
              <Input
                v-model="linkUrl"
                placeholder="Enter URL"
                class="w-full"
              />
              <Button
                size="sm"
                class="self-end rounded-lg"
                @click="text.action(linkUrl)"
              >
                Set Link
              </Button>
            </PopoverContent>
          </Popover>
        </Button>
      </div>
    </div>
  </BubbleMenu>
</template>
