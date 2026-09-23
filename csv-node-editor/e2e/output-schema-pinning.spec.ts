import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Output schema file updates', () => {
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