import { test, expect } from '@playwright/test'

test('adds ConditionNode with two inputs and selectable operators', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🔗 Condition Node' }).click()

  const conditionNode = page.locator('.custom-node.condition-node')
  await expect(conditionNode).toBeVisible()
  await expect(conditionNode).toContainText('Value 1')
  await expect(conditionNode).toContainText('Value 2')
  await expect(conditionNode.locator('.vue-flow__handle[data-handleid="value1"]')).toBeVisible()
  await expect(conditionNode.locator('.vue-flow__handle[data-handleid="value2"]')).toBeVisible()
  await expect(conditionNode.locator('.vue-flow__handle[data-handleid="value2"]')).toHaveClass(/vue-flow__handle-left/)
  await expect(conditionNode.locator('.vue-flow__handle[data-handleid="value2"]')).not.toHaveClass(/vue-flow__handle-right/)
  await expect(conditionNode.locator('select')).toHaveValue('and')
  await expect(conditionNode.locator('select option')).toHaveText(['AND', 'OR', 'XOR'])
})

test('evaluates AND, OR, and XOR using the truthiness of both input values', async ({ page }) => {
  await page.goto('/')

  const plan = {
    version: 1,
    fileName: 'conditions.csv',
    headers: ['Left', 'Right'],
    rows: [
      { Left: 'true', Right: 'true' },
      { Left: 'true', Right: 'false' },
      { Left: 'false', Right: 'true' },
      { Left: '', Right: 'true' },
      { Left: 'yes', Right: 'false' }
    ],
    nodes: [
      { id: 'node_input', type: 'input', position: { x: 50, y: 100 }, data: {} },
      {
        id: 'node_condition',
        type: 'condition',
        position: { x: 300, y: 100 },
        data: { operator: 'and' }
      },
      {
        id: 'node_output',
        type: 'output',
        position: { x: 600, y: 100 },
        data: { columns: ['Result'] }
      }
    ],
    edges: [
      { id: 'e1', source: 'node_input', sourceHandle: 'Left', target: 'node_condition', targetHandle: 'value1' },
      { id: 'e2', source: 'node_input', sourceHandle: 'Right', target: 'node_condition', targetHandle: 'value2' },
      { id: 'e3', source: 'node_condition', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Result' }
    ]
  }

  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'conditions-plan.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(plan))
  })

  const outputRows = page.locator('.table-preview table tbody tr')
  await expect(outputRows).toHaveCount(5)
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(3).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(4).locator('td').first()).toHaveText('false')

  const operatorSelect = page.locator('.custom-node.condition-node select')
  await operatorSelect.selectOption('or')
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(3).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(4).locator('td').first()).toHaveText('true')

  await operatorSelect.selectOption('xor')
  await expect(outputRows.nth(0).locator('td').first()).toHaveText('false')
  await expect(outputRows.nth(1).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(2).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(3).locator('td').first()).toHaveText('true')
  await expect(outputRows.nth(4).locator('td').first()).toHaveText('true')
})
