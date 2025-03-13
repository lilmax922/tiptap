import { Extension } from '@tiptap/vue-3'
import {
  Plugin,
  PluginKey,
  TextSelection,
} from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

export interface PlusButtonOptions {
  /**
   * The offset of the plus button from the node
   */
  offset: number

  /**
   * Tags to be excluded for plus button
   */
  excludedTags: string[]

  /**
   * Custom nodes to be included for plus button
   */
  customNodes: string[]

  /*
   * The css selector to query for the plus button. (eg: '.custom-button').
   * If button element is found, that element will be used as plus button. If not, a default button will be created
   */
  buttonSelector?: string
}

function absoluteRect(node: Element) {
  const data = node.getBoundingClientRect()
  const modal = node.closest('[role="dialog"]')

  if (modal && window.getComputedStyle(modal).transform !== 'none') {
    const modalRect = modal.getBoundingClientRect()

    return {
      top: data.top - modalRect.top,
      left: data.left - modalRect.left,
      width: data.width,
    }
  }
  return {
    top: data.top,
    left: data.left,
    width: data.width,
  }
}

function nodeDOMAtCoords(
  coords: { x: number, y: number },
  options: PlusButtonOptions,
) {
  const selectors = [
    'li',
    'p:not(:first-child)',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    ...options.customNodes.map(node => `[data-type=${node}]`),
  ].join(', ')
  return document
    .elementsFromPoint(coords.x, coords.y)
    .find(
      (elem: Element) =>
        elem.parentElement?.matches?.('.ProseMirror')
        || elem.matches(selectors),
    )
}

function nodePosAtDOM(
  node: Element,
  view: EditorView,
  options: PlusButtonOptions,
) {
  const boundingRect = node.getBoundingClientRect()

  return view.posAtCoords({
    left: boundingRect.left + 50 + options.offset,
    top: boundingRect.top + 1,
  })?.inside
}

function calcNodePos(pos: number, view: EditorView) {
  const $pos = view.state.doc.resolve(pos)
  if ($pos.depth > 1)
    return $pos.before($pos.depth)
  return pos
}

export function PlusButtonPlugin(
  options: PlusButtonOptions & { pluginKey: string },
) {
  let plusButtonElement: HTMLElement | null = null

  function hidePlusButton() {
    if (plusButtonElement) {
      plusButtonElement.classList.add('hide')
    }
  }

  function showPlusButton() {
    if (plusButtonElement) {
      plusButtonElement.classList.remove('hide')
    }
  }

  function hideButtonOnEditorOut(event: MouseEvent) {
    if (event.target instanceof Element) {
      // Check if the relatedTarget class is still inside the editor
      const relatedTarget = event.relatedTarget as HTMLElement
      const isInsideEditor
        = relatedTarget?.classList.contains('tiptap')
          || relatedTarget?.classList.contains('plus-button')

      if (isInsideEditor)
        return
    }
    hidePlusButton()
  }

  return new Plugin({
    key: new PluginKey(options.pluginKey),
    view: (view) => {
      const buttonBySelector = options.buttonSelector
        ? document.querySelector<HTMLElement>(options.buttonSelector)
        : null
      plusButtonElement = buttonBySelector ?? document.createElement('div')
      plusButtonElement.dataset.plusButton = ''
      plusButtonElement.classList.add('plus-button')

      function onPlusButtonClick(e: MouseEvent) {
        e.preventDefault()

        const node = nodeDOMAtCoords(
          {
            x: e.clientX + 50 + options.offset,
            y: e.clientY,
          },
          options,
        )

        if (!(node instanceof Element))
          return

        let nodePos = nodePosAtDOM(node, view, options)
        if (nodePos == null || nodePos < 0)
          return
        nodePos = calcNodePos(nodePos, view)

        // Create a text selection at the current node position
        const selection = TextSelection.create(view.state.doc, nodePos)

        // Apply the selection and insert "/"
        view.focus()
        view.dispatch(
          view.state.tr
            .setSelection(selection)
            .insertText('/'),
        )
      }

      plusButtonElement.addEventListener('click', onPlusButtonClick)

      hidePlusButton()

      if (!buttonBySelector) {
        view?.dom?.parentElement?.appendChild(plusButtonElement)
      }
      view?.dom?.parentElement?.addEventListener(
        'mouseout',
        hideButtonOnEditorOut,
      )

      return {
        destroy: () => {
          if (!buttonBySelector) {
            plusButtonElement?.remove?.()
          }
          plusButtonElement?.removeEventListener('click', onPlusButtonClick)
          plusButtonElement = null
          view?.dom?.parentElement?.removeEventListener(
            'mouseout',
            hideButtonOnEditorOut,
          )
        },
      }
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) {
            return
          }

          const node = nodeDOMAtCoords(
            {
              x: event.clientX + 50 + options.offset,
              y: event.clientY,
            },
            options,
          )

          const notClickable = node?.closest('.not-clickable')
          const excludedTagList = options.excludedTags
            .concat(['ol', 'ul'])
            .join(', ')

          if (
            !(node instanceof Element)
            || node.matches(excludedTagList)
            || notClickable
          ) {
            hidePlusButton()
            return
          }

          const compStyle = window.getComputedStyle(node)
          const parsedLineHeight = Number.parseInt(compStyle.lineHeight, 10)
          const lineHeight = Number.isNaN(parsedLineHeight)
            ? Number.parseInt(compStyle.fontSize) * 1.2
            : parsedLineHeight
          const paddingTop = Number.parseInt(compStyle.paddingTop, 10)

          const rect = absoluteRect(node)

          rect.top += (lineHeight - 24) / 2
          rect.top += paddingTop
          // Li markers
          if (node.matches('ul:not([data-type=taskList]) li, ol li')) {
            rect.left -= options.offset
          }
          rect.width = options.offset

          if (!plusButtonElement)
            return

          plusButtonElement.style.left = `${rect.left - rect.width}px`
          plusButtonElement.style.top = `${rect.top}px`
          showPlusButton()
        },
        keydown: () => {
          hidePlusButton()
        },
        mousewheel: () => {
          hidePlusButton()
        },
      },
    },
  })
}

const PlusButton = Extension.create<PlusButtonOptions>({
  name: 'plusButton',

  addOptions() {
    return {
      offset: 20,
      excludedTags: [],
      customNodes: [],
    }
  },

  addProseMirrorPlugins() {
    return [
      PlusButtonPlugin({
        pluginKey: 'plusButton',
        offset: this.options.offset,
        buttonSelector: this.options.buttonSelector,
        excludedTags: this.options.excludedTags,
        customNodes: this.options.customNodes,
      }),
    ]
  },
})

export default PlusButton
