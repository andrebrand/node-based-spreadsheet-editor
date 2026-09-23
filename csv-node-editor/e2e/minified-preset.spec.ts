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
        portNames: { input: 'Source value', output: 'Extracted value' }
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
      { id: 'node_input', type: 'input', position: { x: 50, y: 100 }, data: { columns: ['Value', 'Result'] } },
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
  await expect(compactNode.locator('.port-row.left .port-label-text')).toHaveText('Source value')
  await expect(compactNode.locator('.port-row.right .port-label-text')).toHaveText('Extracted value')
  await expect(compactNode.locator('.vue-flow__handle-input')).toBeVisible()
  await expect(compactNode.locator('.vue-flow__handle-output')).toBeVisible()

  await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const compact = pipeline.nodes.value.find((node: any) => node.type === 'preset')
    pipeline.edges.value.push(
      { id: 'compact-input', source: 'node_input', target: compact.id, sourceHandle: 'Value', targetHandle: 'input' },
      { id: 'compact-output', source: compact.id, target: 'node_output', sourceHandle: 'output', targetHandle: 'target-Result' }
    )
  })

  const rows = page.locator('.table-preview table tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('42')
  await expect(rows.nth(1)).toContainText('7')

  await page.getByRole('button', { name: /Presets \(1\)/ }).click()
  await page.locator('.preset-expand-btn').click()
  await expect(page.locator('.group-node')).toBeVisible()
  await expect(page.locator('.group-node .group-node-header')).toContainText('Extract digits')
})