import { test, expect } from '@playwright/test'
import path from 'path'

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
})