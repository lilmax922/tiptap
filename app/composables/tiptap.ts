import type { Ref } from 'vue'
import { ref, watch } from 'vue'

import type { Editor } from '@tiptap/vue-3'
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import UnderLine from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import Image from '@tiptap/extension-image'

import { TiptapCommandSuggestion } from './suggestion'
import DragHandle from './drag-handle'
import PlusButton from './plus-button'

export interface UseTiptapOptions {
  content: Ref<string>
  placeholder: Ref<string>
  onSubmit?: () => void
  onFocus?: () => void
  onPaste?: (event: ClipboardEvent) => void
  autofocus?: boolean
}

export function useTiptap(options: UseTiptapOptions) {
  if (import.meta.server)
    return { editor: ref<Editor | undefined>() }

  const {
    content,
    placeholder,
    autofocus,
  } = options

  const editor = useEditor({
    content: content.value,
    extensions: [
      StarterKit,
      UnderLine,
      Link,
      Image,
      Placeholder.configure({
        placeholder: () => placeholder.value!,
      }),
      Mention
        .extend({ name: 'command' })
        .configure({
          suggestion: TiptapCommandSuggestion,
        }),
      BubbleMenu.configure({
        tippyOptions: {
          placement: 'bottom-start',
        },
      }),
      DragHandle.configure({
        position: 'right',
      }),
      PlusButton.configure({
        offset: 30,
      }),
    ],
    onUpdate: ({ editor }) => {
      content.value = editor.getHTML()
    },
    editorProps: {
      attributes: {
        class: 'content-editor content-rich',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    autofocus,
    editable: true,
  })

  watch(content, (value) => {
    if (editor.value?.getHTML() === value)
      return
    editor.value?.commands.setContent(value || '', false)
  })
  watch(placeholder, () => {
    editor.value?.view.dispatch(editor.value?.state.tr)
  })

  return {
    editor,
  }
}
