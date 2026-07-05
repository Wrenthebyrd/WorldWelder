import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { StoredImage } from '@/components/common/StoredImage'

function StoredImageNodeView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      <StoredImage imageId={node.attrs.imageId as number} className="max-h-96" />
    </NodeViewWrapper>
  )
}

export const StoredImageExtension = Node.create({
  name: 'storedImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      imageId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-stored-image]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-stored-image': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(StoredImageNodeView)
  },

  addCommands() {
    return {
      insertStoredImage:
        (imageId: number) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { imageId } }),
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    storedImage: {
      insertStoredImage: (imageId: number) => ReturnType
    }
  }
}
