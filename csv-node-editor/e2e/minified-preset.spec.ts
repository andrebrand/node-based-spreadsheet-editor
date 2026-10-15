import { test, expect } from '@playwright/test'

test('spawns compact presets and expands the same preset into a group', async ({ page }) => {
  const preset = {
    id: 'preset_regex',
    name: 'Extract digits',
    createdAt: 1,
    originalGroupId: 'group_original',
    width: 420,
    height: 260,
    group: {
      label: 'Extract digits',
      data: {
        inputs: [{ id: 'input', internalId: 'internal-input', defaultName: 'Input' }],
        outputs: [{ id: 'output', internalId: 'internal-output', defaultName: 'Output' }],
        portNames: { input: 'Value', output: 'Result' }
      }
    },
    childNodes: [
      {
        id: 'regex_original',
        type: 'regex',
        label: 'Regex',
        position: { x: 80, y: 80 },
        data: { pattern: '\\d+', replacement: '', mode: 'match', flags: '' }
      }
    ],
    edges: [
      { source: 'group_original', target: 'regex_original', sourceHandle: 'internal-input', targetHandle: 'input' },
      { source: 'regex_original', target: 'group_original', sourceHandle: 'output', targetHandle: 'internal-output' }
    ]
  }

  await page.addInitScript((storedPreset) => {
    localStorage.setItem('csv_editor_group_presets', JSON.stringify([storedPreset]))
  }, preset)
  await page.goto('/')

  const plan = {
    version: 1,
    fileName: 'values.csv',
    headers: ['Value', 'Result'],
    rows: [{ Value: 'Order 42', Result: '' }, { Value: 'Item 7', Result: '' }],
    nodes: [
      {
        id: 'node_input',
        type: 'input',
        position: { x: 50, y: 100 },
        data: { fileName: 'values.csv', headers: ['Value', 'Result'] }
      },
      { id: 'node_output', type: 'output', position: { x: 700, y: 100 }, data: { columns: ['Result'] } }
    ],
    edges: []
  }

  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'plan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(plan))
  })

  await page.getByRole('button', { name: /Presets \(1\)/ }).click()
  await page.locator('.preset-spawn-btn').click()

  const compactNode = page.locator('.preset-node')
  await expect(compactNode).toBeVisible()
  await expect(compactNode.locator('.port-row.left .port-label-text')).toHaveText('Value')
  await expect(compactNode.locator('.port-row.right .port-label-text')).toHaveText('Result')
  await expect(compactNode.locator('.vue-flow__handle-input')).toBeVisible()
  await expect(compactNode.locator('.vue-flow__handle-output')).toBeVisible()

  await compactNode.getByRole('button', { name: 'Auto-connect or disconnect preset ports' }).click()

  await expect.poll(() => page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const compact = pipeline.nodes.value.find((node: any) => node.type === 'preset')
    return pipeline.edges.value.filter((edge: any) => (
      edge.source === compact.id || edge.target === compact.id
    )).length
  })).toBe(2)

  const rows = page.locator('.table-preview table tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('42')
  await expect(rows.nth(1)).toContainText('7')

  await compactNode.getByRole('button', { name: 'Auto-connect or disconnect preset ports' }).click()
  await expect.poll(() => page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const compact = pipeline.nodes.value.find((node: any) => node.type === 'preset')
    return pipeline.edges.value.filter((edge: any) => (
      edge.source === compact.id || edge.target === compact.id
    )).length
  })).toBe(0)

  await page.getByRole('button', { name: /Presets \(1\)/ }).click()
  await page.locator('.preset-expand-btn').click()
  await expect(page.locator('.group-node')).toBeVisible()
  await expect(page.locator('.group-node .group-node-header')).toContainText('Extract digits')
})

test('keeps a long presets menu scrollable within the viewport in bottom preview layout', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 520 })
  const presets = Array.from({ length: 30 }, (_, index) => ({
    id: `preset_${index}`,
    name: `Preset ${index + 1}`,
    createdAt: index
  }))
  await page.addInitScript((storedPresets) => {
    localStorage.setItem('csv_editor_group_presets', JSON.stringify(storedPresets))
  }, presets)
  await page.goto('/')

  await page.getByTitle('Display the preview on the bottom').click()
  const presetsToggle = page.getByRole('button', { name: /Presets \(30\)/ })
  await presetsToggle.click()

  const menu = page.locator('.preset-menu-items')
  await expect(menu).toHaveCSS('overflow-y', 'auto')
  await expect.poll(async () => menu.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true)
  await expect.poll(async () => menu.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return bounds.top >= 0 && bounds.bottom <= window.innerHeight
  })).toBe(true)

  await expect.poll(async () => page.evaluate(() => {
    const menu = document.querySelector<HTMLElement>('.preset-menu-items')
    const resizer = document.querySelector<HTMLElement>('.pane-resizer.resizer-bottom')
    if (!menu || !resizer) return false

    const menuBounds = menu.getBoundingClientRect()
    const resizerBounds = resizer.getBoundingClientRect()
    const x = Math.max(menuBounds.left, resizerBounds.left) + 2
    const y = Math.max(menuBounds.top, resizerBounds.top) + 2
    if (x >= Math.min(menuBounds.right, resizerBounds.right) ||
        y >= Math.min(menuBounds.bottom, resizerBounds.bottom)) return false

    return document.elementFromPoint(x, y)?.closest('.preset-menu-items') === menu
  })).toBe(true)

  await menu.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(menu.locator('.preset-menu-item').last()).toBeInViewport()
})