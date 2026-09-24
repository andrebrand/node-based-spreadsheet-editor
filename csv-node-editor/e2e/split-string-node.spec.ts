import { test, expect } from '@playwright/test'

test('Split String Node creates outputs and splits values by a separator', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '✂ Split String Node' }).click()

  const splitNode = page.locator('.custom-node.split-string-node')
  await expect(splitNode).toBeVisible()
  await expect(splitNode.locator('.vue-flow__handle-input')).toBeVisible()
  await expect(splitNode.locator('.vue-flow__handle-separator')).toBeVisible()
  await expect(splitNode.locator('.vue-flow__handle-output-0')).toBeVisible()
  await expect(splitNode.locator('.vue-flow__handle-output-1')).toBeVisible()

  await splitNode.getByRole('button', { name: '+ Output' }).click()
  await expect(splitNode.locator('.vue-flow__handle-output-2')).toBeVisible()

  await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const splitNode = pipeline.nodes.value.find((node: any) => node.type === 'splitString')
    splitNode.data.portNames = { input: 'Text', separator: 'Separator' }
    pipeline.rawData.value = {
      fileName: 'split.csv',
      headers: ['Text', 'Separator'],
      rows: [{ Text: 'red|green|blue', Separator: '|' }]
    }
    pipeline.nodes.value = [
      {
        id: 'node_input',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { headers: ['Text', 'Separator'] }
      },
      splitNode,
      {
        id: 'node_output',
        type: 'output',
        position: { x: 700, y: 0 },
        data: { columns: ['First', 'Second', 'Third'] }
      }
    ]
    pipeline.edges.value = [
      { id: 'input-text', source: 'node_input', sourceHandle: 'Text', target: splitNode.id, targetHandle: 'input' },
      { id: 'input-separator', source: 'node_input', sourceHandle: 'Separator', target: splitNode.id, targetHandle: 'separator' },
      { id: 'split-first', source: splitNode.id, sourceHandle: 'output-0', target: 'node_output', targetHandle: 'target-First' },
      { id: 'split-second', source: splitNode.id, sourceHandle: 'output-1', target: 'node_output', targetHandle: 'target-Second' },
      { id: 'split-third', source: splitNode.id, sourceHandle: 'output-2', target: 'node_output', targetHandle: 'target-Third' }
    ]
  })

  await expect(page.locator('.table-preview table')).toContainText('red')
  await expect(page.locator('.table-preview table')).toContainText('green')
  await expect(page.locator('.table-preview table')).toContainText('blue')
})