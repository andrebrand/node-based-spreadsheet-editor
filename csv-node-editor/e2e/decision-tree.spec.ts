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
  await dialog.getByRole('button', { name: 'Coalesce Node zum Canvas hinzufügen' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.custom-node.coalesce-node')).toHaveCount(1)
})
