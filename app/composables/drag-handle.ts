import { Extension } from '@tiptap/vue-3'
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { Node } from '@tiptap/pm/model'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'

export interface DragHandleOptions {
  /**
   * The width of the drag handle
   */
  dragHandleWidth: number

  /**
   * The threshold for scrolling
   */
  scrollThreshold: number

  /**
   * Position of the drag handle
   * 'left' - Will be shown on the left side of the node (default)
   * 'right' - Will be shown on the right side of the node
   */
  position: 'left' | 'right'

  /**
   * Horizontal offset from the node edge (can be negative)
   */
  horizontalOffset: number

  /**
   * Vertical offset (can be negative)
   */
  verticalOffset: number

  /*
   * The css selector to query for the drag handle. (eg: '.custom-handle').
   * If handle element is found, that element will be used as drag handle. If not, a default handle will be created
   */
  dragHandleSelector?: string

  /**
   * Tags to be excluded for drag handle
   */
  excludedTags: string[]

  /**
   * Custom nodes to be included for drag handle
   */
  customNodes: string[]
}

function absoluteRect(node: Element) {
  const data = node.getBoundingClientRect()
  const modal = node.closest('[role="dialog"]')

  if (modal && window.getComputedStyle(modal).transform !== 'none') {
    const modalRect = modal.getBoundingClientRect()

    return {
      top: data.top - modalRect.top,
      left: data.left - modalRect.left,
      right: data.right - modalRect.left,
      width: data.width,
    }
  }
  return {
    top: data.top,
    left: data.left,
    right: data.right,
    width: data.width,
  }
}

function nodeDOMAtCoords(
  coords: { x: number, y: number },
  options: DragHandleOptions,
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
  options: DragHandleOptions,
) {
  const boundingRect = node.getBoundingClientRect()

  const xPos = options.position === 'left'
    ? boundingRect.left + 50 + options.dragHandleWidth
    : boundingRect.right - 50 - options.dragHandleWidth

  return view.posAtCoords({
    left: xPos,
    top: boundingRect.top + 1,
  })?.inside
}

function calcNodePos(pos: number, view: EditorView) {
  const $pos = view.state.doc.resolve(pos)
  if ($pos.depth > 1)
    return $pos.before($pos.depth)
  return pos
}

export function DragHandlePlugin(
  options: DragHandleOptions & { pluginKey: string },
) {
  let listType = ''
  function handleDragStart(event: DragEvent, view: EditorView) {
    view.focus()

    if (!event.dataTransfer)
      return

    const xOffset = options.position === 'left'
      ? 50 + options.dragHandleWidth
      : -50 - options.dragHandleWidth

    const node = nodeDOMAtCoords(
      {
        x: event.clientX + xOffset,
        y: event.clientY,
      },
      options,
    )

    if (!(node instanceof Element))
      return

    let draggedNodePos = nodePosAtDOM(node, view, options)
    if (draggedNodePos == null || draggedNodePos < 0)
      return
    draggedNodePos = calcNodePos(draggedNodePos, view)

    const { from, to } = view.state.selection
    const diff = from - to

    const fromSelectionPos = calcNodePos(from, view)
    let differentNodeSelected = false

    const nodePos = view.state.doc.resolve(fromSelectionPos)

    // Check if nodePos points to the top level node
    if (nodePos.node().type.name === 'doc') {
      differentNodeSelected = true
    }
    else {
      const nodeSelection = NodeSelection.create(
        view.state.doc,
        nodePos.before(),
      )

      // Check if the node where the drag event started is part of the current selection
      differentNodeSelected = !(
        draggedNodePos + 1 >= nodeSelection.$from.pos
        && draggedNodePos <= nodeSelection.$to.pos
      )
    }
    let selection = view.state.selection
    if (
      !differentNodeSelected
      && diff !== 0
      && !(view.state.selection instanceof NodeSelection)
    ) {
      const endSelection = NodeSelection.create(view.state.doc, to - 1)
      selection = TextSelection.create(
        view.state.doc,
        draggedNodePos,
        endSelection.$to.pos,
      )
    }
    else {
      selection = NodeSelection.create(view.state.doc, draggedNodePos)

      // if inline node is selected, e.g mention -> go to the parent node to select the whole node
      // if table row is selected, go to the parent node to select the whole node
      if (
        (selection as NodeSelection).node.type.isInline
        || (selection as NodeSelection).node.type.name === 'tableRow'
      ) {
        const $pos = view.state.doc.resolve(selection.from)
        selection = NodeSelection.create(view.state.doc, $pos.before())
      }
    }
    view.dispatch(view.state.tr.setSelection(selection))

    // If the selected node is a list item, we need to save the type of the wrapping list e.g. OL or UL
    if (
      view.state.selection instanceof NodeSelection
      && view.state.selection.node.type.name === 'listItem'
    ) {
      listType = node.parentElement!.tagName
    }

    const slice = view.state.selection.content()
    const { dom, text } = serializeForClipboard(view, slice)

    event.dataTransfer.clearData()
    event.dataTransfer.setData('text/html', dom.innerHTML)
    event.dataTransfer.setData('text/plain', text)
    event.dataTransfer.effectAllowed = 'copyMove'

    event.dataTransfer.setDragImage(node, 0, 0)

    view.dragging = { slice, move: event.ctrlKey }
  }

  let dragHandleElement: HTMLElement | null = null

  function hideDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.add('hide')
    }
  }

  function showDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.remove('hide')
    }
  }

  function hideHandleOnEditorOut(event: MouseEvent) {
    if (event.target instanceof Element) {
      // Check if the relatedTarget class is still inside the editor
      const relatedTarget = event.relatedTarget as HTMLElement
      const isInsideEditor
        = relatedTarget?.classList.contains('tiptap')
        || relatedTarget?.classList.contains('drag-handle')

      if (isInsideEditor)
        return
    }
    hideDragHandle()
  }

  return new Plugin({
    key: new PluginKey(options.pluginKey),
    view: (view) => {
      const handleBySelector = options.dragHandleSelector
        ? document.querySelector<HTMLElement>(options.dragHandleSelector)
        : null
      dragHandleElement = handleBySelector ?? document.createElement('div')
      dragHandleElement.draggable = true
      dragHandleElement.dataset.dragHandle = ''
      dragHandleElement.classList.add('drag-handle')

      // Add position class
      dragHandleElement.classList.add(`position-${options.position}`)

      function onDragHandleDragStart(e: DragEvent) {
        handleDragStart(e, view)
      }

      dragHandleElement.addEventListener('dragstart', onDragHandleDragStart)

      function onDragHandleDrag(e: DragEvent) {
        hideDragHandle()
        const scrollY = window.scrollY
        if (e.clientY < options.scrollThreshold) {
          window.scrollTo({ top: scrollY - 30, behavior: 'smooth' })
        }
        else if (window.innerHeight - e.clientY < options.scrollThreshold) {
          window.scrollTo({ top: scrollY + 30, behavior: 'smooth' })
        }
      }

      dragHandleElement.addEventListener('drag', onDragHandleDrag)

      hideDragHandle()

      if (!handleBySelector) {
        view?.dom?.parentElement?.appendChild(dragHandleElement)
      }
      view?.dom?.parentElement?.addEventListener(
        'mouseout',
        hideHandleOnEditorOut,
      )

      return {
        destroy: () => {
          if (!handleBySelector) {
            dragHandleElement?.remove?.()
          }
          dragHandleElement?.removeEventListener('drag', onDragHandleDrag)
          dragHandleElement?.removeEventListener(
            'dragstart',
            onDragHandleDragStart,
          )
          dragHandleElement = null
          view?.dom?.parentElement?.removeEventListener(
            'mouseout',
            hideHandleOnEditorOut,
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

          const xOffset = options.position === 'left'
            ? 50 + options.dragHandleWidth
            : -50 - options.dragHandleWidth

          const node = nodeDOMAtCoords(
            {
              x: event.clientX + xOffset,
              y: event.clientY,
            },
            options,
          )

          const notDragging = node?.closest('.not-draggable')
          const excludedTagList = options.excludedTags
            .concat(['ol', 'ul'])
            .join(', ')

          if (
            !(node instanceof Element)
            || node.matches(excludedTagList)
            || notDragging
          ) {
            hideDragHandle()
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
          rect.top += options.verticalOffset

          if (options.position === 'left') {
            // Left position + horizontal offset
            rect.left -= options.dragHandleWidth
            rect.left += options.horizontalOffset

            // Li markers special handling
            if (node.matches('ul:not([data-type=taskList]) li, ol li')) {
              rect.left -= options.dragHandleWidth
            }
          }
          else {
            // Right position + horizontal offset
            rect.left = rect.right
            rect.left += options.horizontalOffset
          }

          rect.width = options.dragHandleWidth

          if (!dragHandleElement)
            return

          // Apply the calculated position
          if (options.position === 'left') {
            dragHandleElement.style.left = `${rect.left - rect.width}px`
          }
          else {
            dragHandleElement.style.left = `${rect.left}px`
          }

          dragHandleElement.style.top = `${rect.top}px`
          showDragHandle()
        },
        keydown: () => {
          hideDragHandle()
        },
        mousewheel: () => {
          hideDragHandle()
        },
        // dragging class is used for CSS
        dragstart: (view) => {
          view.dom.classList.add('dragging')
        },
        drop: (view, event) => {
          view.dom.classList.remove('dragging')
          hideDragHandle()
          let droppedNode: Node | null = null
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })

          if (!dropPos)
            return

          if (view.state.selection instanceof NodeSelection) {
            droppedNode = view.state.selection.node
          }
          if (!droppedNode)
            return

          const resolvedPos = view.state.doc.resolve(dropPos.pos)

          const isDroppedInsideList
            = resolvedPos.parent.type.name === 'listItem'

          // If the selected node is a list item and is not dropped inside a list, we need to wrap it inside <ol> tag otherwise ol list items will be transformed into ul list item when dropped
          if (
            view.state.selection instanceof NodeSelection
            && view.state.selection.node.type.name === 'listItem'
            && !isDroppedInsideList
            && listType == 'OL'
          ) {
            const newList = view.state.schema.nodes.orderedList?.createAndFill(
              null,
              droppedNode,
            )
            const slice = new Slice(Fragment.from(newList), 0, 0)
            view.dragging = { slice, move: event.ctrlKey }
          }
        },
        dragend: (view) => {
          view.dom.classList.remove('dragging')
        },
      },
    },
  })
}

const ConfigurableDragHandle = Extension.create<DragHandleOptions>({
  name: 'configurableDragHandle',

  addOptions() {
    return {
      dragHandleWidth: 20,
      scrollThreshold: 100,
      position: 'left' as 'left' | 'right',
      horizontalOffset: 0,
      verticalOffset: 0,
      excludedTags: [],
      customNodes: [],
    }
  },

  addProseMirrorPlugins() {
    return [
      DragHandlePlugin({
        pluginKey: 'configurableDragHandle',
        dragHandleWidth: this.options.dragHandleWidth,
        scrollThreshold: this.options.scrollThreshold,
        position: this.options.position,
        horizontalOffset: this.options.horizontalOffset,
        verticalOffset: this.options.verticalOffset,
        dragHandleSelector: this.options.dragHandleSelector,
        excludedTags: this.options.excludedTags,
        customNodes: this.options.customNodes,
      }),
    ]
  },
})

export default ConfigurableDragHandle