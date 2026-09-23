import { test, expect } from '@playwright/test'

test('ctrl-click connects matching ports and cycles through free targets', async ({ page }) => {
  await page.goto('/')

  for (let index = 0; index < 2; index++) {
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '💫 RegEx Node' }).click()
    await page.waitForTimeout(10)
  }

  await page.getByRole('button', { name: '+ Functions' }).click()
  await page.getByRole('button', { name: '🆎 String Node' }).click()

  const regexNodes = page.locator('.custom-node.transform-node')
  await expect(regexNodes).toHaveCount(2)

  await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    pipeline.nodes.value
      .filter((node: any) => node.type === 'regex')
      .forEach((node: any, index: number) => {
        node.data.portNames = { ...(node.data.portNames || {}), input: 'Auto' }
        node.position = { x: 420, y: index * 180 }
      })
    const stringNode = pipeline.nodes.value.find((node: any) => node.type === 'string')
    stringNode.data.portNames = { ...(stringNode.data.portNames || {}), output: 'Auto' }
    stringNode.position = { x: 80, y: 100 }
  })

  const sourceHandle = page.locator('.custom-node.string-node .vue-flow__handle-output')
  await sourceHandle.evaluate((element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })))

  const firstConnection = await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const stringNode = pipeline.nodes.value.find((node: any) => node.type === 'string')
    return pipeline.edges.value.find((edge: any) => (
      edge.source === stringNode.id && edge.sourceHandle === 'output'
    ))
  })
  expect(firstConnection).toBeDefined()

  const targetIds = await page.evaluate(() => (
    (window as any).__PIPELINE__.nodes.value
      .filter((node: any) => node.type === 'regex')
      .map((node: any) => node.id)
      .sort()
  ))
  expect(firstConnection.target).toBe(targetIds[0])

  await sourceHandle.evaluate((element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })))
  const secondConnection = await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const stringNode = pipeline.nodes.value.find((node: any) => node.type === 'string')
    return pipeline.edges.value.find((edge: any) => edge.source === stringNode.id && edge.sourceHandle === 'output')
  })
  expect(secondConnection?.target).toBe(targetIds[1])

  await sourceHandle.evaluate((element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })))
  const wrappedConnection = await page.evaluate(() => {
    const pipeline = (window as any).__PIPELINE__
    const stringNode = pipeline.nodes.value.find((node: any) => node.type === 'string')
    return pipeline.edges.value.find((edge: any) => edge.source === stringNode.id && edge.sourceHandle === 'output')
  })
  expect(wrappedConnection?.target).toBe(targetIds[0])
})