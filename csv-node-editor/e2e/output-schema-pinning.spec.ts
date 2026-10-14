import { test, expect } from '@playwright/test'
import path from 'path'

async function pasteText(input: import('@playwright/test').Locator, text: string) {
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

test.describe('Output schema file updates', () => {
  test('uses the current file name for the tab and exports', async ({ page }) => {
    await page.goto('/')
    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    await expect(page).toHaveTitle('csv-node-editor - example.csv')

    const outputNode = page.locator('.custom-node.output-node')
    await expect(outputNode.locator('.output-column-name')).toHaveCount(4)
    const csvDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download CSV' }).click()
    await expect((await csvDownload).suggestedFilename()).toBe('example.csv')

    const excelDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download Excel' }).click()
    await expect((await excelDownload).suggestedFilename()).toBe('example.xlsx')
  })

  test('updates the output schema when it is not pinned', async ({ page }) => {
    await page.goto('/')
    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    const outputNode = page.locator('.custom-node.output-node')
    await expect(outputNode.locator('.output-column-name')).toHaveCount(4)

    await uploadInput.setInputFiles(path.resolve('example2.csv'))

    await expect(outputNode.locator('.output-column-name')).toHaveCount(4)
    await expect(outputNode).toContainText('Kat')
    await expect(outputNode).not.toContainText('Kategorie')

    const directEdges = await page.evaluate(() => {
      return (window as any).__PIPELINE__.edges.value
        .filter((edge: any) => edge.source === 'node_input' && edge.target === 'node_output')
        .map((edge: any) => `${edge.sourceHandle}:${edge.targetHandle}`)
        .sort()
    })
    expect(directEdges).toEqual(['Hersteller:target-Hersteller', 'Kat:target-Kat', 'Laenge:target-Laenge', 'Name:target-Name'])
  })

  test('pasting a single column name does not replace the output schema', async ({ page }) => {
    await page.goto('/')
    await page.locator('header input[type="file"][accept*="csv"]').setInputFiles(path.resolve('example.csv'))

    const outputNode = page.locator('.custom-node.output-node')
    const columnNames = outputNode.locator('.output-column-name')
    const originalColumns = await columnNames.allTextContents()
    await expect(columnNames).toHaveCount(4)

    const newColumnInput = outputNode.getByPlaceholder('New Column...')
    await pasteText(newColumnInput, 'Single field')

    await expect(newColumnInput).toHaveValue('Single field')
    await expect(columnNames).toHaveCount(4)
    await expect(columnNames).toHaveText(originalColumns)
  })

  test('keeps the output schema when it is pinned', async ({ page }) => {
    await page.goto('/')
    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    const outputNode = page.locator('.custom-node.output-node')
    await outputNode.getByRole('button', { name: '📍 Pin' }).click()
    await expect(outputNode.getByRole('button', { name: '📌 Pinned' })).toBeVisible()

    await uploadInput.setInputFiles(path.resolve('example2.csv'))

    await expect(outputNode.locator('.output-column-name')).toHaveCount(4)
    await expect(outputNode).toContainText('Kategorie')
    await expect(outputNode.getByText('Kat', { exact: true })).toHaveCount(0)
  })

  test('appends pasted column headers to the pinned output schema', async ({ page }) => {
    await page.goto('/')
    await page.locator('header input[type="file"][accept*="csv"]').setInputFiles(path.resolve('example.csv'))

    const outputNode = page.locator('.custom-node.output-node')
    const columnNames = outputNode.locator('.output-column-name')
    const originalColumns = await columnNames.allTextContents()
    const originalEdges = await page.evaluate(() => (
      (window as any).__PIPELINE__.edges.value
        .filter((edge: any) => edge.target === 'node_output')
        .map((edge: any) => `${edge.source}:${edge.sourceHandle}:${edge.targetHandle}`)
        .sort()
    ))

    await outputNode.getByRole('button', { name: '📍 Pin' }).click()
    const newColumnInput = outputNode.getByPlaceholder('New Column...')
    await pasteText(newColumnInput, 'Single field')

    await expect(newColumnInput).toHaveValue('Single field')
    await expect(columnNames).toHaveText(originalColumns)

    await pasteText(newColumnInput, 'Name\tFirst\r\nSecond\tThird\r\nFourth')

    await expect(columnNames).toHaveText([...originalColumns, 'First', 'Second', 'Third', 'Fourth'])
    await expect(newColumnInput).toHaveValue('')
    const currentEdges = await page.evaluate(() => (
      (window as any).__PIPELINE__.edges.value
        .filter((edge: any) => edge.target === 'node_output')
        .map((edge: any) => `${edge.source}:${edge.sourceHandle}:${edge.targetHandle}`)
        .sort()
    ))
    expect(currentEdges).toEqual(originalEdges)
  })
})