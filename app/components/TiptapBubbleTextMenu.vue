<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { type Component, computed, ref } from 'vue'
import {
  ChevronDownIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  TypeIcon,
} from 'lucide-vue-next'

interface TextMenuCategory {
  label: string
  id: string
  type: 'category'
}

interface TextMenuOption {
  label: string
  id: string
  type: 'option'
  isActive: boolean
  action: () => void
  icon: Component
}

type TextMenu = Array<TextMenuCategory | TextMenuOption>

const props = defineProps<{ editor: Editor }>()

const textMenu = computed<TextMenu>(() => [
  {
    type: 'category',
    label: 'Hierarchy',
    id: 'hierarchy',
  },
  {
    label: 'Paragraph',
    id: 'paragraph',
    type: 'option',
    isActive: props.editor.isActive('paragraph'),
    action: () => props.editor.chain().focus().setParagraph().run(),
    icon: PilcrowIcon,
  },
  {
    label: 'Heading 1',
    id: 'heading1',
    type: 'option',
    isActive: props.editor.isActive('heading', { level: 1 }),
    action: () => props.editor.chain().focus().setHeading({ level: 1 }).run(),
    icon: Heading1Icon,
  },
  {
    label: 'Heading 2',
    id: 'heading2',
    type: 'option',
    isActive: props.editor.isActive('heading', { level: 2 }),
    action: () => props.editor.chain().focus().setHeading({ level: 2 }).run(),
    icon: Heading2Icon,
  },
  {
    label: 'Heading 3',
    id: 'heading3',
    type: 'option',
    isActive: props.editor.isActive('heading', { level: 3 }),
    action: () => props.editor.chain().focus().setHeading({ level: 3 }).run(),
    icon: Heading3Icon,
  },
  {
    label: 'Heading 4',
    id: 'heading4',
    type: 'option',
    isActive: props.editor.isActive('heading', { level: 4 }),
    action: () => props.editor.chain().focus().setHeading({ level: 4 }).run(),
    icon: Heading4Icon,
  },
  {
    type: 'category',
    label: 'Lists',
    id: 'lists',
  },
  {
    label: 'Bullet List',
    id: 'bulletList',
    type: 'option',
    isActive: props.editor.isActive('bulletList'),
    action: () => props.editor.chain().focus().toggleBulletList().run(),
    icon: ListIcon,
  },
  {
    label: 'Ordered List',
    id: 'orderedList',
    type: 'option',
    isActive: props.editor.isActive('orderedList'),
    action: () => props.editor.chain().focus().toggleOrderedList().run(),
    icon: ListOrderedIcon,
  },
])

const isOpen = ref(false)
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="inline-flex items-center gap-1"
      >
        <TypeIcon class="size-5" />
        <ChevronDownIcon
          class="size-2 transition-transform duration-300"
          :class="{ 'rotate-180': isOpen }"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      class="p-0"
      :align-offset="-5"
      align="start"
      :side-offset="10"
    >
      <template
        v-for="menu in textMenu"
        :key="menu.id"
      >
        <template v-if="menu.type === 'category'">
          <DropdownMenuLabel>
            {{ menu.label }}
          </DropdownMenuLabel>
        </template>
        <DropdownMenuItem
          v-else-if="menu.type === 'option'"
          class="flex items-center gap-2.5"
          :class="{ 'bg-gray-100': menu.isActive }"
          @click="menu.action"
        >
          <component :is="menu.icon" />
          {{ menu.label }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
