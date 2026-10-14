import { test, expect, type Locator } from '@playwright/test'

async function pasteText(input: Locator, text: string) {
  await input.evaluate((element, clipboardText) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', clipboardText)
    element.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData,
      bubbles: true,
      cancelable: true
    }))
  }, text)
}

test('Mapping Node maps values, supports case-insensitive matching, and swaps pairs', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🗺 Mapping Node' }).click()

  const mappingNode = page.locator('.custom-node.mapping-node')
  await expect(mappingNode).toBeVisible()
  await expect(mappingNode.locator('.vue-flow__handle-input')).toBeVisible()
  await expect(mappingNode.locator('.vue-flow__handle-output')).toBeVisible()
  await mappingNode.getByRole('button', { name: '+ Pair' }).click()
  await expect(mappingNode.getByRole('textbox', { name: 'Key 3' })).toBeVisible()
  await mappingNode.getByRole('button', { name: 'Remove pair 3' }).click()

  await mappingNode.getByRole('textbox', { name: 'Key 1' }).fill('pending')
  await mappingNode.getByRole('textbox', { name: 'Value 1' }).fill('In progress')
  await mappingNode.getByRole('textbox', { name: 'Key 2' }).fill('closed')
  await mappingNode.getByRole('textbox', { name: 'Value 2' }).fill('Done')

  await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const mappingNode = pipeline.nodes.value.find((node: any) => node.type === 'mapping')
    pipeline.rawData.value = {
      fileName: 'mapping.csv',
      headers: ['Status'],
      rows: [{ Status: 'pending' }, { Status: 'CLOSED' }, { Status: 'unknown' }]
    }
    pipeline.nodes.value = [
      { id: 'node_input', type: 'input', position: { x: 0, y: 0 }, data: {} },
      mappingNode,
      { id: 'node_output', type: 'output', position: { x: 700, y: 0 }, data: { columns: ['Label'] } }
    ]
    pipeline.edges.value = [
      { id: 'input-map', source: 'node_input', sourceHandle: 'Status', target: mappingNode.id, targetHandle: 'input' },
      { id: 'map-output', source: mappingNode.id, sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Label' }
    ]
  })

  const tableRows = page.locator('.table-preview table tbody tr')
  await expect(tableRows).toHaveCount(3)
  await expect(tableRows.nth(0)).toHaveText('In progress')
  await expect(tableRows.nth(1)).toHaveText('')
  await expect(tableRows.nth(2)).toHaveText('')

  await mappingNode.getByRole('checkbox', { name: 'Case insensitive' }).check()
  await expect(tableRows.nth(0)).toContainText('In progress')
  await expect(tableRows.nth(1)).toContainText('Done')
  await expect(tableRows.nth(2)).toContainText('')

  await mappingNode.getByRole('button', { name: 'Swap keys and values' }).click()
  await expect(mappingNode.getByRole('textbox', { name: 'Key 1' })).toHaveValue('In progress')
  await expect(mappingNode.getByRole('textbox', { name: 'Value 1' })).toHaveValue('pending')
  await expect(tableRows.nth(0)).toHaveText('')
  await expect(tableRows.nth(1)).toHaveText('')
})

test('Mapping Node pastes tab- or semicolon-separated pairs into an empty key field', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🗺 Mapping Node' }).click()

  const mappingNode = page.locator('.custom-node.mapping-node')
  await pasteText(
    mappingNode.getByRole('textbox', { name: 'Key 1' }),
    'red\trouge\r\nblue\tbleu\r\n'
  )
  await expect(mappingNode.getByRole('textbox', { name: 'Key 1' })).toHaveValue('red')
  await expect(mappingNode.getByRole('textbox', { name: 'Value 2' })).toHaveValue('bleu')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 3' })).toHaveCount(0)

  await mappingNode.getByRole('button', { name: '+ Pair' }).click()
  await pasteText(
    mappingNode.getByRole('textbox', { name: 'Key 3' }),
    'green;vert\namber;ambre'
  )
  await expect(mappingNode.getByRole('textbox', { name: 'Key 3' })).toHaveValue('green')
  await expect(mappingNode.getByRole('textbox', { name: 'Value 4' })).toHaveValue('ambre')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 5' })).toHaveCount(0)

  await mappingNode.getByRole('button', { name: '+ Pair' }).click()
  const fifthKey = mappingNode.getByRole('textbox', { name: 'Key 5' })
  await pasteText(fifthKey, 'single\tvalue')
  await expect(fifthKey).toHaveValue('')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 6' })).toHaveCount(0)

  await pasteText(fifthKey, 'missing delimiter\nsecond row')
  await expect(fifthKey).toHaveValue('')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 6' })).toHaveCount(0)

  await fifthKey.fill('keep')
  await pasteText(fifthKey, 'new\tvalue\nother\trow')
  await expect(fifthKey).toHaveValue('keep')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 6' })).toHaveCount(0)
})

test('Mapping Node clears the last pair instead of removing its row', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🗺 Mapping Node' }).click()

  const mappingNode = page.locator('.custom-node.mapping-node')
  await mappingNode.getByRole('button', { name: 'Remove pair 2' }).click()
  await mappingNode.getByRole('textbox', { name: 'Key 1' }).fill('active')
  await mappingNode.getByRole('textbox', { name: 'Value 1' }).fill('Enabled')

  await mappingNode.getByRole('button', { name: 'Remove pair 1' }).click()

  await expect(mappingNode.getByRole('textbox', { name: 'Key 1' })).toHaveValue('')
  await expect(mappingNode.getByRole('textbox', { name: 'Value 1' })).toHaveValue('')
  await expect(mappingNode.getByRole('textbox', { name: 'Key 2' })).toHaveCount(0)
})