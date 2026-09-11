import { ref } from 'vue'
import type { Edge } from '@vue-flow/core'
import { nodes, edges } from './usePipeline'

export interface PresetChildNode {
  id: string
  type?: string
  label?: string
  position: { x: number; y: number }
  data: any
}

export interface PresetEdge {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface GroupPreset {
  id: string
  name: string
  createdAt: number
  originalGroupId: string
  width: number
  height: number
  group: {
    label: string
    data: any
  }
  childNodes: PresetChildNode[]
  edges: PresetEdge[]
}

const STORAGE_KEY = 'csv_editor_group_presets'

function loadFromStorage(): GroupPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load presets from localStorage', err)
    return []
  }
}

function saveToStorage(items: GroupPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to save presets to localStorage', err)
  }
}

export const presets = ref<GroupPreset[]>(loadFromStorage())

export const namingDialog = ref<{
  isOpen: boolean
  groupId: string
  name: string
}>({
  isOpen: false,
  groupId: '',
  name: ''
})

export function isDefaultGroupName(name?: string): boolean {
  if (!name) return true
  const trimmed = name.trim()
  return trimmed === '' || trimmed === 'Group' || trimmed === '🔳 Group Node'
}

export function openNamingDialog(groupId: string, defaultName = '') {
  namingDialog.value = {
    isOpen: true,
    groupId,
    name: defaultName
  }
}

export function closeNamingDialog() {
  namingDialog.value = {
    isOpen: false,
    groupId: '',
    name: ''
  }
}

export function confirmNamingDialog(): boolean {
  if (!namingDialog.value.groupId || !namingDialog.value.name.trim()) return false
  const success = saveGroupAsPreset(namingDialog.value.groupId, namingDialog.value.name.trim())
  if (success) {
    closeNamingDialog()
  }
  return success
}

export function saveGroupAsPreset(groupId: string, presetName?: string): boolean {
  const nodeList = nodes.value as any[]
  const sourceGroup = nodeList.find((n) => n.id === groupId)
  if (!sourceGroup) return false

  const name = presetName?.trim() || sourceGroup.data?.label || sourceGroup.label || 'Group Preset'

  // Update label on the group node in canvas
  sourceGroup.label = name
  if (sourceGroup.data) {
    sourceGroup.data.label = name
  }

  const groupWidth = sourceGroup.data?.width || sourceGroup.width || 420
  const groupHeight = sourceGroup.data?.height || sourceGroup.height || 260
  const groupCompPos = sourceGroup.computedPosition || sourceGroup.position

  // Find inner child nodes
  const innerNodes = nodeList.filter((n) => {
    if (n.id === sourceGroup.id || n.type === 'input' || n.type === 'output') return false
    if (n.parentNode === sourceGroup.id) return true

    const childCompPos = n.computedPosition || n.position
    const childDim = n.dimensions || { width: 220, height: 160 }

    if (groupCompPos && childCompPos) {
      return (
        childCompPos.x >= groupCompPos.x &&
        childCompPos.y >= groupCompPos.y &&
        childCompPos.x + childDim.width <= groupCompPos.x + groupWidth &&
        childCompPos.y + childDim.height <= groupCompPos.y + groupHeight
      )
    }
    return false
  })

  // Calculate relative positions for child nodes
  const childNodes: PresetChildNode[] = innerNodes.map((child) => {
    let relPos = { ...child.position }
    const childPos = child.computedPosition || child.position
    if (!child.parentNode && groupCompPos && childPos) {
      relPos = {
        x: childPos.x - groupCompPos.x,
        y: childPos.y - groupCompPos.y
      }
    }

    return {
      id: child.id,
      type: child.type,
      label: child.label,
      position: relPos,
      data: JSON.parse(JSON.stringify(child.data || {}))
    }
  })

  const childIdSet = new Set(innerNodes.map((c) => c.id))
  childIdSet.add(sourceGroup.id)

  // Find internal edges between inner nodes and the group
  const edgeList = edges.value as Edge[]
  const internalEdges: PresetEdge[] = []

  edgeList.forEach((e) => {
    if (childIdSet.has(e.source) && childIdSet.has(e.target)) {
      internalEdges.push({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined
      })
    }
  })

  const newPreset: GroupPreset = {
    id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: Date.now(),
    originalGroupId: sourceGroup.id,
    width: groupWidth,
    height: groupHeight,
    group: {
      label: name,
      data: JSON.parse(JSON.stringify(sourceGroup.data || {}))
    },
    childNodes,
    edges: internalEdges
  }

  // If a preset with the same name already exists, update it; otherwise append
  const existingIndex = presets.value.findIndex((p) => p.name === name)
  if (existingIndex >= 0) {
    presets.value.splice(existingIndex, 1, newPreset)
  } else {
    presets.value.push(newPreset)
  }

  saveToStorage(presets.value)
  return true
}

export function deletePreset(presetId: string) {
  presets.value = presets.value.filter((p) => p.id !== presetId)
  saveToStorage(presets.value)
}

export function spawnPreset(preset: GroupPreset, spawnPosition: { x: number; y: number }) {
  const idMap = new Map<string, string>()
  const newGroupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  idMap.set(preset.originalGroupId, newGroupId)

  // Map each child node to a new unique ID
  for (const child of preset.childNodes) {
    const newChildId = `${child.type || 'node'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    idMap.set(child.id, newChildId)
  }

  const newGroupNode = {
    id: newGroupId,
    type: 'group',
    label: preset.group.label || preset.name || 'Group',
    position: spawnPosition,
    width: preset.width,
    height: preset.height,
    style: {
      width: `${preset.width}px`,
      height: `${preset.height}px`
    },
    data: {
      ...JSON.parse(JSON.stringify(preset.group.data || {})),
      label: preset.group.label || preset.name || 'Group',
      width: preset.width,
      height: preset.height
    }
  }

  const newChildNodes = preset.childNodes.map((child) => {
    return {
      id: idMap.get(child.id)!,
      type: child.type,
      label: child.label,
      position: { ...child.position },
      parentNode: newGroupId,
      data: JSON.parse(JSON.stringify(child.data || {}))
    }
  })

  const newEdges: Edge[] = []
  preset.edges.forEach((e) => {
    const newSource = idMap.get(e.source)
    const newTarget = idMap.get(e.target)
    if (newSource && newTarget) {
      newEdges.push({
        id: `e_${newSource}_${e.sourceHandle || ''}-${newTarget}_${e.targetHandle || ''}`,
        source: newSource,
        target: newTarget,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle
      })
    }
  })

  ;(nodes.value as any[]).push(newGroupNode, ...newChildNodes)
  if (newEdges.length > 0) {
    ;(edges.value as any[]).push(...newEdges)
  }
}

