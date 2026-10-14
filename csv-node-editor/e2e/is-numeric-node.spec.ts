import { test, expect } from '@playwright/test'

test('adds IsNumeric Node with a decimal separator option', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🔢 IsNumeric Node' }).click()

  const numericNode = page.locator('.custom-node.is-numeric-node')
  await expect(numericNode).toBeVisible()
  await expect(numericNode.locator('.vue-flow__handle[data-handleid="input"]')).toBeVisible()
  await expect(numericNode.locator('.vue-flow__handle[data-handleid="output"]')).toBeVisible()
  await expect(numericNode.getByRole('checkbox', { name: 'Allow comma and period as decimal separators' })).toBeChecked()
})

test('checks numeric strings with optional comma and period decimal separators', async ({ page }) => {
  await page.goto('/')

  const plan = {
    version: 1,
    fileName: 'numeric-values.csv',
    headers: ['Value'],
    rows: [
      { Value: '42' },
      { Value: '-3.14' },
      { Value: '3,14' },
      { Value: 'text' },
      { Value: '' },
      { Value: '1,234.56' }
    ],
    nodes: [
      { id: 'node_input', type: 'input', position: { x: 50, y: 100 }, data: {} },
      {
        id: 'node_numeric',
        type: 'isNumeric',
        position: { x: 300, y: 100 },
        data: { allowDecimalSeparators: true }
      },
      {
        id: 'node_output',
        type: 'output',
        position: { x: 600, y: 100 },
        data: { columns: ['Is numeric'] }
      }
    ],
    edges: [
      { id: 'e1', source: 'node_input', sourceHandle: 'Value', target: 'node_numeric', targetHandle: 'input' },
      { id: 'e2', source: 'node_numeric', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Is numeric' }
    ]
  }

  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'numeric-plan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(plan))
  })

  const outputRows = page.locator('.table-preview table tbody tr')
  await expect(outputRows).toHaveCount(6)
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(3).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(4).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(5).locator('td').first()).toHaveText('false')

  await page.locator('.custom-node.is-numeric-node input[type="checkbox"]').uncheck()
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('false')
})
