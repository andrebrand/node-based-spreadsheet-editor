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