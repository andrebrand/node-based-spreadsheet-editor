export function getNodePortName(node: any, handleId?: string | null, _side?: 'source' | 'target'): string {
  if (!node || !handleId) return ''

  // 1. Check if explicitly renamed in data.portNames
  if (node.data?.portNames?.[handleId]) {
    return node.data.portNames[handleId]
  }

  // 2. Input node: default port name is the header itself
  if (node.type === 'input') {
    return handleId
  }

  // 3. Output node: default port name is the column name (handle is target-{col})
  if (node.type === 'output') {
    if (handleId.startsWith('target-')) {
      return handleId.slice('target-'.length)
    }
    return handleId
  }

  // 4. Group node
  if (node.type === 'group') {
    if (handleId === 'input') return node.data?.portNames?.['input'] || 'Input'
    if (handleId === 'output') return node.data?.portNames?.['output'] || 'Output'
    if (handleId === 'internal-input') return node.data?.portNames?.['internal-input'] || node.data?.portNames?.['input'] || '|'
    if (handleId === 'internal-output') return node.data?.portNames?.['internal-output'] || node.data?.portNames?.['output'] || '|'

    // Check dynamic port definitions if present
    const matchingInput = node.data?.inputs?.find?.((p: any) => p.id === handleId || p.internalId === handleId)
    if (matchingInput) {
      if (handleId === matchingInput.id) return matchingInput.defaultName || 'Input'
      return '|'
    }
    const matchingOutput = node.data?.outputs?.find?.((p: any) => p.id === handleId || p.internalId === handleId)
    if (matchingOutput) {
      if (handleId === matchingOutput.id) return matchingOutput.defaultName || 'Output'
      return '|'
    }

    if (handleId.startsWith('input-')) {
      const idx = parseInt(handleId.slice('input-'.length), 10)
      return `Input ${isNaN(idx) ? '' : idx + 1}`
    }
    if (handleId.startsWith('output-')) {
      const idx = parseInt(handleId.slice('output-'.length), 10)
      return `Output ${isNaN(idx) ? '' : idx + 1}`
    }
    if (handleId.startsWith('internal-input-')) return '|'
    if (handleId.startsWith('internal-output-')) return '|'
  }

  // 5. Combine strings node
  if (node.type === 'combine') {
    if (handleId === 'string1') return 'String 1'
    if (handleId === 'string2') return 'String 2'
    if (handleId === 'separator') return 'Separator'
    if (handleId === 'output') return 'Output'
  }

  // 6. Compare node
  if (node.type === 'compare') {
    if (handleId === 'leftString') return 'String 1'
    if (handleId === 'rightString') return 'String 2'
    if (handleId === 'output') return 'true / false'
  }

  // 7. Counter node
  if (node.type === 'counter') {
    if (handleId === 'start') return 'Start value'
    if (handleId === 'output') return 'Output'
  }

  // 8. If node
  if (node.type === 'if') {
    if (handleId === 'condition') return 'If'
    if (handleId === 'then') return 'Then'
    if (handleId === 'else') return 'Else'
    if (handleId === 'output') return 'Output'
  }

  // 9. Join node
  if (node.type === 'join') {
    if (handleId.startsWith('input-')) {
      const idx = parseInt(handleId.slice('input-'.length), 10)
      return `Input ${isNaN(idx) ? 1 : idx + 1}`
    }
    if (handleId === 'output') return 'Array'
  }

  // 10. Split node
  if (node.type === 'split') {
    if (handleId === 'input') return 'Array'
    if (handleId.startsWith('output-')) {
      const idx = parseInt(handleId.slice('output-'.length), 10)
      return `Output ${isNaN(idx) ? 1 : idx + 1}`
    }
  }

  // 11. Regex node
  if (node.type === 'regex') {
    if (handleId === 'input') return 'Input'
    if (handleId === 'output') return 'Output'
  }

  // 12. String node
  if (node.type === 'string') {
    if (handleId === 'output') return 'Output'
  }

  // 13. UniqueCount node
  if (node.type === 'uniqueCountNode' || node.type === 'uniqueCount') {
    if (handleId === 'start') return 'Start value'
    if (handleId.startsWith('input-')) {
      const idx = parseInt(handleId.slice('input-'.length), 10)
      return `Input ${isNaN(idx) ? 1 : idx + 1}`
    }
    if (handleId === 'output') return 'Output'
  }

  // 14. Coalesce node
  if (node.type === 'coalesce') {
    if (handleId.startsWith('input-')) {
      const idx = parseInt(handleId.slice('input-'.length), 10)
      return `Input ${isNaN(idx) ? 1 : idx + 1}`
    }
    if (handleId === 'output') return 'Output'
  }

  return handleId
}

export function setNodePortName(nodeData: any, handleId: string, newName: string) {
  if (!nodeData) return
  if (!nodeData.portNames) {
    nodeData.portNames = {}
  }
  const trimmed = newName.trim()
  if (trimmed) {
    nodeData.portNames[handleId] = trimmed
  } else {
    delete nodeData.portNames[handleId]
  }
}

export function isTargetHandle(nodeType: string | undefined, handleId: string): boolean {
  if (!handleId) return false
  if (nodeType === 'input') return false
  if (nodeType === 'output') return handleId.startsWith('target-')
  if (nodeType === 'regex') return handleId === 'input'
  if (nodeType === 'string') return false
  if (nodeType === 'combine') return handleId === 'string1' || handleId === 'string2' || handleId === 'separator'
  if (nodeType === 'compare') return handleId === 'leftString' || handleId === 'rightString'
  if (nodeType === 'counter') return handleId === 'start'
  if (nodeType === 'uniqueCountNode' || nodeType === 'uniqueCount') return handleId === 'start' || handleId.startsWith('input-')
  if (nodeType === 'coalesce') return handleId.startsWith('input-')
  if (nodeType === 'if') return handleId === 'condition' || handleId === 'then' || handleId === 'else'
  if (nodeType === 'join') return handleId.startsWith('input-')
  if (nodeType === 'split') return handleId === 'input'
  if (nodeType === 'group') return handleId === 'input' || handleId === 'internal-output'
  if (nodeType === 'group') return handleId === 'input' || handleId.startsWith('input-') || handleId === 'internal-output' || handleId.startsWith('internal-output-')
  return !handleId.includes('output')
}

export function normalizeTargetHandle(nodeType: string | undefined, handleId?: string | null): string {
  if (handleId) return handleId
  if (nodeType === 'regex' || nodeType === 'split') return 'input'
  if (nodeType === 'group') return 'input'
  return ''
}
