import type { ReactNode } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { nodeLabel, nodeTypeLabel } from '@/lib/flowGraph'
import type { FlowNode, OperatorDef } from '@/types'

export type FlowGraphNode = Node<FlowNode, FlowNode['type']>

function Shell({
  node,
  operators,
  selected,
  children,
}: {
  node: FlowNode
  operators: OperatorDef[]
  selected: boolean
  children?: ReactNode
}) {
  return (
    <div className={`flow-node flow-node-${node.type} flow-node-${node.type === 'end' ? node.role : node.type}${selected ? ' selected' : ''}`}>
      {node.type !== 'start' ? <Handle type="target" position={Position.Left} /> : null}
      <strong>{nodeLabel(node, operators)}</strong>
      <span>{nodeTypeLabel(node)}</span>
      {children}
      {node.type === 'condition' ? (
        <>
          <Handle type="source" position={Position.Right} id="true" style={{ top: '32%' }} />
          <Handle type="source" position={Position.Right} id="false" style={{ top: '72%' }} />
        </>
      ) : node.type !== 'end' ? (
        <Handle type="source" position={Position.Right} />
      ) : null}
    </div>
  )
}

function view(operators: OperatorDef[]) {
  return function FlowNodeView({ data, selected }: NodeProps<FlowGraphNode>) {
    return <Shell node={data} operators={operators} selected={selected} />
  }
}

export function createNodeTypes(operators: OperatorDef[]) {
  const NodeView = view(operators)
  return {
    start: NodeView,
    operator: NodeView,
    http: NodeView,
    condition: NodeView,
    end: NodeView,
  }
}
