import type { SuggestionOptions } from '@tiptap/suggestion'
import type { GetReferenceClientRect, Instance } from 'tippy.js'
import type { Component } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { VueRenderer } from '@tiptap/vue-3'
import { PluginKey } from '@tiptap/pm/state'
import tippy from 'tippy.js'
import TiptapCommandsList from '~/components/TiptapCommandsList.vue'

export const TiptapCommandSuggestion: Partial<SuggestionOptions> = {
  pluginKey: new PluginKey('command'),
  char: '/',
  items: ({ query }) => {
    return [
      {
        title: 'Heading 1',
        command: (editor: Editor) => {
          editor.chain().focus().setNode('heading', { level: 1 }).run()
        },
      },
      {
        title: 'Heading 2',
        command: (editor: Editor) => {
          editor.chain().focus().setNode('heading', { level: 2 }).run()
        },
      },
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
  },
  command: ({ editor, props, range }) => {
    editor.commands.deleteRange(range)
    props.command(editor)
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

        popup = tippy(document.body, {
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
          appendTo: () => document.body,
          content: renderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
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
      },
    }
  }
}
