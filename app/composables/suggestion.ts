import type { SuggestionOptions } from '@tiptap/suggestion'
import type { GetReferenceClientRect, Instance } from 'tippy.js'
import type { Component } from 'vue'
import { VueRenderer } from '@tiptap/vue-3'
import { PluginKey } from '@tiptap/pm/state'
import tippy from 'tippy.js'
import { Heading1, Heading2, Heading3, Heading4, ImageIcon, List, ListOrdered, Pilcrow } from 'lucide-vue-next'
import TiptapCommandsList from '~/components/TiptapCommandsList.vue'

let globalPopupInstance: Instance | null = null
let globalClientRect: GetReferenceClientRect | null = null

export const TiptapCommandSuggestion: Partial<SuggestionOptions> = {
  pluginKey: new PluginKey('command'),
  char: '/',
  items: ({ editor }) => {
    const commands: Command[] = [
      {
        name: 'Hierarchy',
        id: 'hierarchy',
        type: 'category',
      },
      {
        name: 'Paragraph',
        id: 'paragraph',
        type: 'option',
        isActive: editor.isActive('paragraph'),
        action: () => editor.chain().focus().setParagraph().run(),
        icon: Pilcrow,
      },
      {
        name: 'Heading 1',
        id: 'heading1',
        type: 'option',
        isActive: editor.isActive('heading', { level: 1 }),
        action: () => editor.chain().focus().setNode('heading', { level: 1 }).run(),
        icon: Heading1,
      },
      {
        name: 'Heading 2',
        id: 'heading2',
        type: 'option',
        isActive: editor.isActive('heading', { level: 2 }),
        action: () => editor.chain().focus().setHeading({ level: 2 }).run(),
        icon: Heading2,
      },
      {
        name: 'Heading 3',
        id: 'heading3',
        type: 'option',
        isActive: editor.isActive('heading', { level: 3 }),
        action: () => editor.chain().focus().setHeading({ level: 3 }).run(),
        icon: Heading3,
      },
      {
        name: 'Heading 4',
        id: 'heading4',
        type: 'option',
        isActive: editor.isActive('heading', { level: 4 }),
        action: () => editor.chain().focus().setHeading({ level: 4 }).run(),
        icon: Heading4,
      },
      {
        name: 'Lists',
        id: 'lists',
        type: 'category',
      },
      {
        name: 'Bullet List',
        id: 'bullet_list',
        type: 'option',
        isActive: editor.isActive('bulletList'),
        action: () => editor.chain().focus().toggleBulletList().run(),
        icon: List,
      },
      {
        name: 'Ordered List',
        id: 'ordered_list',
        type: 'option',
        isActive: editor.isActive('orderedList'),
        action: () => editor.chain().focus().toggleOrderedList().run(),
        icon: ListOrdered,
      },
      {
        name: 'Insert',
        id: 'insert',
        type: 'category',
      },
      {
        name: 'Image',
        id: 'image',
        type: 'option',
        isActive: false,
        action: () => {},
        icon: ImageIcon,
      },
    ]
    return commands
  },
  command: ({ editor, props: commandAction, range }) => {
    editor.commands.deleteRange(range)
    commandAction()
  },
  render: createSuggestionRenderer(TiptapCommandsList),
}

function createSuggestionRenderer(component: Component): SuggestionOptions['render'] {
  return () => {
    let renderer: VueRenderer
    let popup: Instance

    return {
      onStart(props) {
        renderer = new VueRenderer(component, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect)
          return

        globalClientRect = props.clientRect as GetReferenceClientRect

        popup = tippy(document.body, {
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
          appendTo: () => document.body,
          content: renderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })

        globalPopupInstance = popup
      },

      // Use arrow function here because Nuxt will transform it incorrectly as Vue hook causing the build to fail
      onBeforeUpdate: (props) => {
        if (props.editor.isFocused)
          renderer.updateProps({ ...props, isPending: true })
      },

      onUpdate(props) {
        if (!props.editor.isFocused)
          return

        renderer.updateProps({ ...props, isPending: false })

        if (!props.clientRect)
          return

        globalClientRect = props.clientRect as GetReferenceClientRect

        popup?.setProps({
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup?.hide()
          return true
        }
        return renderer?.ref?.onKeyDown(props.event)
      },

      onExit() {
        popup?.destroy()
        renderer?.destroy()
        globalPopupInstance = null
      },
    }
  }
}

export function toggleSuggestionTippyPopup(show: boolean) {
  if (globalPopupInstance) {
    if (show && globalClientRect) {
      globalPopupInstance.setProps({
        getReferenceClientRect: globalClientRect,
      })
      globalPopupInstance.show()
    }
    else {
      globalPopupInstance.hide()
    }
  }
}
