import { test, expect } from '@playwright/test'
import path from 'path'

test('deleting the input node preserves other processing nodes', async ({ page }) => {
  await page.goto('/')

  await page.locator('header input[type="file"][accept*="csv"]').setInputFiles(path.resolve('example.csv'))

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '💫 RegEx Node' }).click()

  const inputNode = page.locator('.custom-node.input-node')
  const regexNode = page.locator('.custom-node.transform-node')
  await expect(inputNode).toBeVisible()
  await expect(regexNode).toBeVisible()

  await inputNode.click()
  await page.keyboard.press('Delete')

  await expect(inputNode).toHaveCount(0)
  await expect(page.locator('.custom-node.output-node')).toHaveCount(0)
  await expect(regexNode).toBeVisible()
})

test('input node toggles the preview between input and output data', async ({ page }) => {
  await page.goto('/')
  await page.locator('header input[type="file"][accept*="csv"]').setInputFiles('example.csv')

  const preview = page.locator('.table-preview')
  const inputNode = page.locator('.custom-node.input-node')
  await expect(preview.getByRole('heading', { name: 'Output preview' })).toBeVisible()
  await expect(preview.locator('table')).toContainText('Schreinerei Bla')

  await inputNode.getByRole('button', { name: 'Show input preview' }).click()
  await expect(preview.getByRole('heading', { name: 'Input preview' })).toBeVisible()
  await expect(preview.getByRole('textbox')).toHaveCount(0)
  await expect(preview.locator('tbody tr').first()).toContainText('Holztisch')
  await expect(preview.locator('table')).toContainText('Kategorie')
  await expect(preview.getByRole('button', { name: 'Download CSV' })).toHaveCount(0)

  await inputNode.getByRole('button', { name: 'Show output preview' }).click()
  await expect(preview.getByRole('heading', { name: 'Output preview' })).toBeVisible()
  await expect(preview.getByRole('button', { name: 'Download CSV' })).toBeVisible()
})

test('editing a cell in the input preview updates the pipeline data', async ({ page }) => {
  await page.goto('/')
  await page.locator('header input[type="file"][accept*="csv"]').setInputFiles('example.csv')

  const preview = page.locator('.table-preview')
  const inputNode = page.locator('.custom-node.input-node')
  await inputNode.getByRole('button', { name: 'Show input preview' }).click()

  await expect(preview.getByRole('textbox')).toHaveCount(0)
  await preview.getByRole('cell', { name: 'Holztisch' }).dblclick()

  const nameCell = preview.getByRole('textbox', { name: 'Row 1, Name' })
  await expect(nameCell).toHaveValue('Holztisch')
  await nameCell.fill('Edited table')
  await expect(nameCell).toHaveValue('Edited table')
  await nameCell.press('Enter')
  await expect(preview.getByRole('textbox')).toHaveCount(0)

  await inputNode.getByRole('button', { name: 'Show output preview' }).click()
  await expect(preview.locator('tbody tr').first()).toContainText('Edited table')
  await expect(preview.locator('tbody tr').nth(1)).toContainText('Lack')
})