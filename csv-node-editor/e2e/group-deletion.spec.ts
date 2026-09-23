import { test, expect } from '@playwright/test'

test('deleting a group also deletes its child nodes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🔳 Group Node' }).click()
  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '💫 RegEx Node' }).click()

  await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const group = pipeline.nodes.value.find((node: any) => node.type === 'group')
    const child = pipeline.nodes.value.find((node: any) => node.type === 'regex')
    child.parentNode = group.id
  })

  const groupNode = page.locator('.group-node')
  await expect(groupNode).toBeVisible()
  await expect(page.locator('.custom-node.transform-node')).toHaveCount(1)

  await groupNode.getByRole('button', { name: 'Delete node' }).click()

  await expect(groupNode).toHaveCount(0)
  await expect(page.locator('.custom-node.transform-node')).toHaveCount(0)
})