import { test, expect } from '@playwright/test'

test.describe('UniqueCountNode End-to-End Tests', () => {
  test('adds UniqueCountNode to canvas and tests UI controls', async ({ page }) => {
    await page.goto('/')

    // Open Functions menu and add UniqueCountNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    const uniqueNodeBtn = page.getByRole('button', { name: '🔢 Unique Count Node' })
    await expect(uniqueNodeBtn).toBeVisible()
    await uniqueNodeBtn.click()

    // Verify node is rendered on canvas
    const uniqueNode = page.locator('.custom-node.unique-count-node')
    await expect(uniqueNode).toBeVisible()
    await expect(uniqueNode).toContainText('🔢 Unique Count Node')

    // Check controls: Input method, Start value, Step size, Mode
    const startModeSelect = uniqueNode.locator('select').first()
    await expect(startModeSelect).toHaveValue('manual')

    const startValueInput = uniqueNode.locator('input[type="number"]').first()
    await expect(startValueInput).toHaveValue('1')

    const stepInput = uniqueNode.locator('input[type="number"]').nth(1)
    await expect(stepInput).toHaveValue('1')

    const modeSelect = uniqueNode.locator('select').nth(1)
    await expect(modeSelect).toHaveValue('id')

    // Check initial input handle
    await expect(uniqueNode).toContainText('Input 1')
    await expect(uniqueNode.locator('.vue-flow__handle-input-0')).toBeVisible()

    // Test adding and removing inputs
    const addInputBtn = uniqueNode.getByRole('button', { name: '+ Input' })
    await addInputBtn.click()
    await expect(uniqueNode).toContainText('Input 2')
    await expect(uniqueNode.locator('.vue-flow__handle-input-1')).toBeVisible()

    const removeInputBtn = uniqueNode.getByRole('button', { name: '- Input' })
    await expect(removeInputBtn).toBeVisible()
    await removeInputBtn.click()
    await expect(uniqueNode).not.toContainText('Input 2')
    await expect(uniqueNode.locator('.vue-flow__handle-input-1')).toHaveCount(0)

    // Test switching to Node input for Start value
    await startModeSelect.selectOption('input')
    await expect(uniqueNode).toContainText('Start value')
    await expect(uniqueNode.locator('.vue-flow__handle-start')).toBeVisible()

    // Switch back to manual/static
    await startModeSelect.selectOption('manual')
    await expect(uniqueNode.locator('.vue-flow__handle-start')).toHaveCount(0)
  })

  test('evaluates unique combination counting correctly in TablePreview', async ({ page }) => {
    await page.goto('/')

    const plan = {
      version: 1,
      fileName: 'test.csv',
      headers: ['Item', 'Category'],
      rows: [
        { Item: 'Chair', Category: 'Furniture' },
        { Item: 'Desk', Category: 'Furniture' },
        { Item: 'Chair', Category: 'Furniture' },
        { Item: 'Laptop', Category: 'Tech' },
        { Item: 'Desk', Category: 'Furniture' }
      ],
      nodes: [
        { id: 'node_input', type: 'input', position: { x: 50, y: 100 }, data: {} },
        {
          id: 'node_unique',
          type: 'uniqueCountNode',
          position: { x: 300, y: 100 },
          data: {
            startMode: 'manual',
            startValue: 1,
            step: 1,
            inputCount: 2,
            mode: 'id'
          }
        },
        {
          id: 'node_output',
          type: 'output',
          position: { x: 600, y: 100 },
          data: { columns: ['UniqueID'] }
        }
      ],
      edges: [
        { id: 'e1', source: 'node_input', sourceHandle: 'Item', target: 'node_unique', targetHandle: 'input-0' },
        { id: 'e2', source: 'node_input', sourceHandle: 'Category', target: 'node_unique', targetHandle: 'input-1' },
        { id: 'e3', source: 'node_unique', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-UniqueID' }
      ]
    }

    // Load plan via hidden plan file input
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.setInputFiles({
      name: 'test-plan.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(plan))
    })

    // Verify preview table has 5 rows
    const tableRows = page.locator('.table-preview table tbody tr')
    await expect(tableRows).toHaveCount(5)

    // In 'id' mode:
    // Row 0 (Chair, Furniture): 1
    // Row 1 (Desk, Furniture): 2
    // Row 2 (Chair, Furniture): 1
    // Row 3 (Laptop, Tech): 3
    // Row 4 (Desk, Furniture): 2
    await expect(tableRows.nth(0)).toContainText('1')
    await expect(tableRows.nth(1)).toContainText('2')
    await expect(tableRows.nth(2)).toContainText('1')
    await expect(tableRows.nth(3)).toContainText('3')
    await expect(tableRows.nth(4)).toContainText('2')

    // Switch mode to 'running'
    const uniqueNode = page.locator('.custom-node.unique-count-node')
    const modeSelect = uniqueNode.locator('select').nth(1)
    await modeSelect.selectOption('running')

    // In 'running' mode:
    // Row 0: 1
    // Row 1: 2
    // Row 2: 2 (still 2 distinct items seen so far)
    // Row 3: 3
    // Row 4: 3
    await expect(tableRows.nth(0)).toContainText('1')
    await expect(tableRows.nth(1)).toContainText('2')
    await expect(tableRows.nth(2)).toContainText('2')
    await expect(tableRows.nth(3)).toContainText('3')
    await expect(tableRows.nth(4)).toContainText('3')

    // Switch back to 'id' mode and test startValue & step size
    await modeSelect.selectOption('id')
    const startValueInput = uniqueNode.locator('input[type="number"]').first()
    const stepInput = uniqueNode.locator('input[type="number"]').nth(1)

    await startValueInput.fill('10')
    await stepInput.fill('5')

    // In 'id' mode with start 10, step 5:
    // Row 0: 10
    // Row 1: 15
    // Row 2: 10
    // Row 3: 20
    // Row 4: 15
    await expect(tableRows.nth(0)).toContainText('10')
    await expect(tableRows.nth(1)).toContainText('15')
    await expect(tableRows.nth(2)).toContainText('10')
    await expect(tableRows.nth(3)).toContainText('20')
    await expect(tableRows.nth(4)).toContainText('15')
  })
})
