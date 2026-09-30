import { test, expect } from '@playwright/test'

test('decision helper adds the recommended node and omits array nodes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Entscheidungshilfe öffnen' }).click()
  const dialog = page.getByRole('dialog', { name: 'Finde den passenden Node' })
  await expect(dialog).toBeVisible()
  await expect(dialog).not.toContainText('Array')
  await expect(dialog).not.toContainText('Join Node')
  await expect(dialog).not.toContainText('Split Node')

  await dialog.getByRole('button', { name: 'Werte aus mehreren Spalten zusammenfügen oder gemeinsam nutzen' }).click()
  await dialog.getByRole('button', { name: /Je nach Inhalt der Zeile/ }).click()
  await dialog.getByRole('button', { name: /Den ersten ausgefüllten Wert/ }).click()
  await expect(dialog.getByRole('heading', { name: 'Coalesce Node' })).toBeVisible()
  await expect(dialog).toContainText('ersten vorhandenen Wert')
  await dialog.getByRole('button', { name: 'Coalesce Node hinzufügen' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.custom-node.coalesce-node')).toHaveCount(1)
})

test('decision helper opens a connected example pipeline in an empty canvas', async ({ page }) => {
  await page.goto('/')

  const dialog = page.getByRole('dialog', { name: 'Finde den passenden Node' })
  await page.getByRole('button', { name: 'Entscheidungshilfe öffnen' }).click()
  await dialog.getByRole('button', { name: /Werte aus mehreren Spalten/ }).click()
  await dialog.getByRole('button', { name: /Die Werte zu einem Text verbinden/ }).click()
  await dialog.getByRole('button', { name: 'Beispiel im Editor öffnen' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.locator('.custom-node.input-node')).toContainText('Beispiel.csv')
  await expect(page.locator('.custom-node.combine-node')).toHaveCount(1)
  await expect(page.locator('.custom-node.output-node')).toHaveCount(1)
  await expect(page.locator('.vue-flow__edge')).toHaveCount(4)
  await expect(page.locator('.table-preview')).toContainText('Länge: 5 m')
})

test('decision helper opens an example in a new tab when a file is loaded', async ({ page }) => {
  await page.goto('/')
  await page.locator('header input[type="file"][accept*="csv"]').setInputFiles('example.csv')
  await expect(page.locator('.custom-node.input-node')).toContainText('example.csv')

  const dialog = page.getByRole('dialog', { name: 'Finde den passenden Node' })
  await page.getByRole('button', { name: 'Entscheidungshilfe öffnen' }).click()
  await dialog.getByRole('button', { name: /Werte aus mehreren Spalten/ }).click()
  await dialog.getByRole('button', { name: /Die Werte zu einem Text verbinden/ }).click()

  const popupPromise = page.context().waitForEvent('page')
  await dialog.getByRole('button', { name: 'Beispiel im Editor öffnen' }).click()
  const popup = await popupPromise

  const popupUrl = new URL(popup.url())
  expect(popupUrl.searchParams.get('node')).toBe('combineStrings')
  expect(popupUrl.searchParams.get('example')).toBe('0')
  expect([...popupUrl.searchParams.keys()].sort()).toEqual(['example', 'node'])
  await expect(popup.locator('.custom-node.input-node')).toContainText('Beispiel.csv')
  await expect(popup.locator('.custom-node.combine-node')).toHaveCount(1)
  await expect(popup.locator('.custom-node.output-node')).toHaveCount(1)
  await expect(popup.locator('.table-preview')).toContainText('Länge: 5 m')
  await expect(page.locator('.custom-node.input-node')).toContainText('example.csv')
  await expect(page.locator('.custom-node.combine-node')).toHaveCount(0)

  await popup.locator('.custom-node.input-node .delete-node-btn').click()
  await expect.poll(() => new URL(popup.url()).search).toBe('')
  await popup.reload()
  await expect(popup.locator('.custom-node.input-node')).toHaveCount(0)
})
