import { addEdge } from '@vue-flow/core'
import type { Connection, Edge } from '@vue-flow/core'
import { edges, nodes } from './usePipeline'
import { getNodePortName } from './usePortNames'

export interface AutoConnectPort {
  nodeId: string
  handleId: string
  type: 'source' | 'target'
}

export function getPortFromElement(element: Element): AutoConnectPort | null {
  const nodeElement = element.closest<HTMLElement>('.vue-flow__node')
  const handleElement = element.closest<HTMLElement>('.vue-flow__handle')
  const nodeId = nodeElement?.getAttribute('data-id')
  const handleId = handleElement?.getAttribute('data-handleid')
  if (!nodeId || !handleId || !handleElement) return null

  const type = handleElement.classList.contains('source') ? 'source' :
    handleElement.classList.contains('target') ? 'target' : null
  if (!type) return null

  return { nodeId, handleId, type }
}

function portKey(port: AutoConnectPort) {
  return `${port.nodeId}:${port.handleId}`
}

function isPortConnected(port: AutoConnectPort, edge: Edge) {
  return port.type === 'source'
    ? edge.source === port.nodeId && edge.sourceHandle === port.handleId
    : edge.target === port.nodeId && edge.targetHandle === port.handleId
}

export function isValidConnection(connection: Connection) {
  if (!connection.sourceHandle || !connection.targetHandle) return false

  const nodeList = nodes.value as Array<{ id: string; type?: string }>
  const sourceNode = nodeList.find((node) => node.id === connection.source)
  const targetNode = nodeList.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) return false

  const sourceType = getHandleType(sourceNode.type, 'source')
  const targetType = getHandleType(targetNode.type, 'target')
  return sourceType === 'any' || targetType === 'any' || sourceType === targetType
}

function getHandleType(nodeType: string | undefined, side: 'source' | 'target') {
  if (nodeType === 'group') return 'any'
  if (nodeType === 'join' && side === 'source') return 'array'
  if (nodeType === 'split' && side === 'target') return 'array'
  if (nodeType === 'split' && side === 'source') return 'string'
  if (nodeType === 'join' && side === 'target') return 'string'
  return 'string'
}

export function connectNodes(connection: Connection) {
  if (!isValidConnection(connection)) return

  const existingEdges = edges.value as Edge[]
  const remainingEdges = existingEdges.filter((edge) => (
    edge.target !== connection.target || edge.targetHandle !== connection.targetHandle
  ))
  edges.value = addEdge(connection, remainingEdges) as Edge[]
}

export function autoConnectPort(port: AutoConnectPort, onConnect = connectNodes) {
  const nodeList = nodes.value as Array<{ id: string; type?: string; data?: Record<string, any> }>
  const clickedNode = nodeList.find((node) => node.id === port.nodeId)
  if (!clickedNode) return

  const oppositeType = port.type === 'source' ? 'target' : 'source'
  const portName = getNodePortName(clickedNode, port.handleId, port.type)
  const oppositePorts = [...document.querySelectorAll<HTMLElement>('.vue-flow__handle')]
    .map((handle) => getPortFromElement(handle))
    .filter((candidate): candidate is AutoConnectPort => (
      !!candidate && candidate.type === oppositeType && candidate.nodeId !== port.nodeId
    ))
    .filter((candidate) => {
      const candidateNode = nodeList.find((node) => node.id === candidate.nodeId)
      return candidateNode && getNodePortName(candidateNode, candidate.handleId, candidate.type) === portName
    })
    .sort((left, right) => portKey(left).localeCompare(portKey(right)))

  const edgeList = edges.value as Edge[]
  const connectedEdges = edgeList
    .filter((edge) => isPortConnected(port, edge))
    .sort((left, right) => {
      const leftPort = port.type === 'source'
        ? { nodeId: left.target, handleId: left.targetHandle || '' }
        : { nodeId: left.source, handleId: left.sourceHandle || '' }
      const rightPort = port.type === 'source'
        ? { nodeId: right.target, handleId: right.targetHandle || '' }
        : { nodeId: right.source, handleId: right.sourceHandle || '' }
      return `${leftPort.nodeId}:${leftPort.handleId}`.localeCompare(`${rightPort.nodeId}:${rightPort.handleId}`)
    })

  const currentEdge = connectedEdges[0]
  const currentPort: AutoConnectPort | null = currentEdge
    ? port.type === 'source'
      ? { nodeId: currentEdge.target, handleId: currentEdge.targetHandle || '', type: oppositeType }
      : { nodeId: currentEdge.source, handleId: currentEdge.sourceHandle || '', type: oppositeType }
    : null
  const remainingEdges = currentEdge ? edgeList.filter((edge) => edge.id !== currentEdge.id) : edgeList
  edges.value = remainingEdges

  const availablePorts = oppositePorts.filter((candidate) => (
    !remainingEdges.some((edge) => isPortConnected(candidate, edge))
  ))
  if (availablePorts.length === 0) return

  let nextPort = availablePorts[0]
  if (currentPort && availablePorts.length > 1) {
    const currentIndex = availablePorts.findIndex((candidate) => portKey(candidate) === portKey(currentPort))
    nextPort = availablePorts[(currentIndex + 1 + availablePorts.length) % availablePorts.length]
  } else if (currentPort && availablePorts.length === 1 && portKey(availablePorts[0]) === portKey(currentPort)) {
    return
  }

  const connection: Connection = port.type === 'source'
    ? { source: port.nodeId, sourceHandle: port.handleId, target: nextPort.nodeId, targetHandle: nextPort.handleId }
    : { source: nextPort.nodeId, sourceHandle: nextPort.handleId, target: port.nodeId, targetHandle: port.handleId }
  onConnect(connection)
}
