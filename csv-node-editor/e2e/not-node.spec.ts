import { test, expect } from '@playwright/test'

test('adds Not Node with one input and one boolean output', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🚫 Not Node' }).click()

  const notNode = page.locator('.custom-node.not-node')
  await expect(notNode).toBeVisible()
  await expect(notNode).toContainText('Input')
  await expect(notNode).toContainText('true / false')
  await expect(notNode.locator('.vue-flow__handle[data-handleid="input"]')).toBeVisible()
  await expect(notNode.locator('.vue-flow__handle[data-handleid="output"]')).toBeVisible()
})

test('negates input truthiness in the output table', async ({ page }) => {
  await page.goto('/')

  const plan = {
    version: 1,
    fileName: 'not-values.csv',
    headers: ['Value'],
    rows: [
      { Value: 'true' },
      { Value: 'false' },
      { Value: 'filled text' },
      { Value: '' }
    ],
    nodes: [
      { id: 'node_input', type: 'input', position: { x: 50, y: 100 }, data: {} },
      { id: 'node_not', type: 'notNode', position: { x: 300, y: 100 }, data: {} },
      {
        id: 'node_output',
        type: 'output',
        position: { x: 600, y: 100 },
        data: { columns: ['Negated'] }
      }
    ],
    edges: [
      { id: 'e1', source: 'node_input', sourceHandle: 'Value', target: 'node_not', targetHandle: 'input' },
      { id: 'e2', source: 'node_not', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Negated' }
    ]
  }

  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'not-plan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(plan))
  })

  const outputRows = page.locator('.table-preview table tbody tr')
  await expect(outputRows).toHaveCount(4)
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(3).locator('td').first()).toHaveText('true')
})
