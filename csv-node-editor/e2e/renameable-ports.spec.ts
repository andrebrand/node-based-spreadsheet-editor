import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Renameable Ports & Connection Preservation Tests', () => {
  test('renames ports on GroupNode and other nodes via double-click', async ({ page }) => {
    await page.goto('/')

    // Add GroupNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '🔳 Group Node' }).click()

    const groupNode = page.locator('.group-node')
    await expect(groupNode).toBeVisible()

    // Outer input port label
    const outerInputLabel = groupNode.locator('.group-port.outer-input .port-label-text')
    await expect(outerInputLabel).toHaveText('Input')

    // Double-click to rename outer-input
    await outerInputLabel.dblclick()
    const outerInputEdit = groupNode.locator('.group-port.outer-input .port-label-input')
    await expect(outerInputEdit).toBeVisible()
    await outerInputEdit.fill('Hersteller')
    await outerInputEdit.press('Enter')

    // Verify it updated
    await expect(outerInputLabel).toHaveText('Hersteller')

    // Outer output port label
    const outerOutputLabel = groupNode.locator('.group-port.outer-output .port-label-text')
    await expect(outerOutputLabel).toHaveText('Output')

    // Double-click to rename outer-output
    await outerOutputLabel.dblclick()
    const outerOutputEdit = groupNode.locator('.group-port.outer-output .port-label-input')
    await expect(outerOutputEdit).toBeVisible()
    await outerOutputEdit.fill('CustomOut')
    await outerOutputEdit.press('Enter')

    // Verify it updated
    await expect(outerOutputLabel).toHaveText('CustomOut')

    // Add CombineStringsNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '➕ Combine Strings Node' }).click()

    const combineNode = page.locator('.custom-node.combine-node')
    await expect(combineNode).toBeVisible()

    // Rename String 1 to Prefix
    const string1Label = combineNode.locator('.port-row').first().locator('.port-label-text')
    await expect(string1Label).toHaveText('String1')
    await string1Label.dblclick()
    const string1Input = combineNode.locator('.port-row').first().locator('.port-label-input')
    await string1Input.fill('Prefix')
    await string1Input.press('Enter')
    await expect(string1Label).toHaveText('Prefix')
  })

  test('preserves connections to named ports when uploading a different input file', async ({ page }) => {
    await page.goto('/')

    const example1Path = path.resolve('example.csv')
    const example2Path = path.resolve('example2.csv')

    // 1. Upload first file (example.csv: Name;Kategorie;Hersteller;Laenge)
    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')
    await uploadInput.setInputFiles(example1Path)

    // Verify input and output nodes exist
    const inputNode = page.locator('.custom-node.input-node')
    await expect(inputNode).toBeVisible()
    await expect(inputNode).toContainText('Hersteller')

    // 2. Add a GroupNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '🔳 Group Node' }).click()

    const groupNode = page.locator('.group-node')
    await expect(groupNode).toBeVisible()

    // 3. Rename GroupNode's outer input port to 'Hersteller'
    const groupInputLabel = groupNode.locator('.group-port.outer-input .port-label-text')
    await groupInputLabel.dblclick()
    const groupInputEdit = groupNode.locator('.group-port.outer-input .port-label-input')
    await groupInputEdit.fill('Hersteller')
    await groupInputEdit.press('Enter')
    await expect(groupInputLabel).toHaveText('Hersteller')

    // 4. Rename GroupNode's outer output port to 'Hersteller_Out'
    const groupOutputLabel = groupNode.locator('.group-port.outer-output .port-label-text')
    await groupOutputLabel.dblclick()
    const groupOutputEdit = groupNode.locator('.group-port.outer-output .port-label-input')
    await groupOutputEdit.fill('Hersteller_Out')
    await groupOutputEdit.press('Enter')
    await expect(groupOutputLabel).toHaveText('Hersteller_Out')

    // 5. Connect node_input.Hersteller -> groupNode.input, and internal-input -> internal-output, and groupNode.output -> node_output
    await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      const gNode = pipeline.nodes.value.find((n: any) => n.type === 'group')
      const gId = gNode?.id
      if (!gId) return

      pipeline.edges.value.push({
        id: `e-input-Hersteller-${gId}-input`,
        source: 'node_input',
        target: gId,
        sourceHandle: 'Hersteller',
        targetHandle: 'input'
      })
      pipeline.edges.value.push({
        id: `e-${gId}-internal-input-${gId}-internal-output`,
        source: gId,
        target: gId,
        sourceHandle: 'internal-input',
        targetHandle: 'internal-output'
      })
      pipeline.edges.value.push({
        id: `e-${gId}-output-node_output-target-Hersteller`,
        source: gId,
        target: 'node_output',
        sourceHandle: 'output',
        targetHandle: 'target-Hersteller'
      })
    })

    // Now upload example2.csv (different file! Name;Hersteller;Kat;Laenge)
    await uploadInput.setInputFiles(example2Path)

    // Verify that the connection from node_input to groupNode is still intact
    const edgesAfter = await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      const allEdges = pipeline?.edges?.value || []
      return allEdges.map((e: any) => ({
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle
      }))
    })

    // Check that an edge exists from node_input with sourceHandle 'Hersteller' to the GroupNode's input handle
    const groupInputEdge = edgesAfter.find(
      (e: any) => e.source === 'node_input' && e.sourceHandle === 'Hersteller' && e.targetHandle === 'input'
    )
    expect(groupInputEdge).toBeDefined()

    // Verify preview table has data from example2.csv
    const previewRows = page.locator('.table-preview table tbody tr')
    await expect(previewRows).toHaveCount(2)
    // example2.csv row 1 has 'Schreinerei Bla', row 2 has 'Ikea'
    await expect(page.locator('.table-preview table')).toContainText('Schreinerei Bla')
    await expect(page.locator('.table-preview table')).toContainText('Ikea')
  })

  test('auto-connects named ports when a different input file containing that column is uploaded', async ({ page }) => {
    await page.goto('/')

    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')

    // 1. Upload example2.csv (columns: Name;Hersteller;Kat;Laenge - does NOT contain Kategorie)
    await uploadInput.setInputFiles(path.resolve('example2.csv'))

    // 2. Add a RegexNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '💫 RegEx Node' }).click()

    const regexNode = page.locator('.custom-node.transform-node')
    await expect(regexNode).toBeVisible()

    // 3. Rename RegexNode's input port to 'Kategorie' (which is NOT in example2.csv)
    const regexInputLabel = regexNode.locator('.port-row').first().locator('.port-label-text')
    await regexInputLabel.dblclick()
    const regexInputEdit = regexNode.locator('.port-row').first().locator('.port-label-input')
    await regexInputEdit.fill('Kategorie')
    await regexInputEdit.press('Enter')
    await expect(regexInputLabel).toHaveText('Kategorie')

    // 4. Now upload example.csv (which DOES contain 'Kategorie'!)
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    // 5. Check that an edge was automatically created connecting node_input.Kategorie -> regexNode.input
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const pipeline = (window as any).__PIPELINE__
        const rNode = pipeline?.nodes?.value?.find((n: any) => n.type === 'regex')
        const rId = rNode?.id
        const allEdges = pipeline?.edges?.value || []
        return allEdges.filter((e: any) => e.target === rId && e.sourceHandle === 'Kategorie' && e.targetHandle === 'input').length
      })
    }).toBe(1)
  })

  test('does not create duplicate edges when switching files with regex node connected to input node', async ({ page }) => {
    await page.goto('/')

    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')

    // 1. Upload example.csv
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    // 2. Add a RegexNode
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '💫 RegEx Node' }).click()

    const regexNode = page.locator('.custom-node.transform-node')
    await expect(regexNode).toBeVisible()

    // 3. Rename RegexNode's input port to 'Name'
    const regexInputLabel = regexNode.locator('.port-row').first().locator('.port-label-text')
    await regexInputLabel.dblclick()
    const regexInputEdit = regexNode.locator('.port-row').first().locator('.port-label-input')
    await regexInputEdit.fill('Name')
    await regexInputEdit.press('Enter')
    await expect(regexInputLabel).toHaveText('Name')

    // 4. Connect node_input.Name -> regexNode.input
    const nameHandle = page.locator('.custom-node.input-node .vue-flow__handle-Name')
    const regexInputHandle = regexNode.locator('.vue-flow__handle-input')
    await nameHandle.dragTo(regexInputHandle)

    // 5. Connect regexNode.output -> node_output.target-Name
    const regexOutputHandle = regexNode.locator('.vue-flow__handle-output')
    const outputNameHandle = page.locator('.custom-node.output-node .vue-flow__handle-target-Name')
    await regexOutputHandle.dragTo(outputNameHandle)

    // 6. Switch to example3.csv (which also has 'Name')
    await uploadInput.setInputFiles(path.resolve('example3.csv'))

    // Wait for graph update
    await page.waitForTimeout(500)

    // 7. Verify edge counts and ensure no duplicate edges exist
    const edgeReport = await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      const rNode = pipeline?.nodes?.value?.find((n: any) => n.type === 'regex')
      const rId = rNode?.id
      const allEdges = pipeline?.edges?.value || []
      const edgesToRegex = allEdges.filter((e: any) => e.target === rId)
      const edgesToOutputName = allEdges.filter((e: any) => e.target === 'node_output' && e.targetHandle === 'target-Name')
      return {
        totalEdges: allEdges.length,
        edgesToRegex,
        edgesToOutputName,
        allEdges
      }
    })

    // Exactly 1 edge targeting regex input
    expect(edgeReport.edgesToRegex.length).toBe(1)
    expect(edgeReport.edgesToRegex[0].source).toBe('node_input')
    expect(edgeReport.edgesToRegex[0].sourceHandle).toBe('Name')
    expect(edgeReport.edgesToRegex[0].targetHandle).toBe('input')

    // Exactly 1 edge targeting node_output target-Name (from regex)
    expect(edgeReport.edgesToOutputName.length).toBe(1)
    expect(edgeReport.edgesToOutputName[0].source).toBe(edgeReport.edgesToRegex[0].target)
    expect(edgeReport.edgesToOutputName[0].targetHandle).toBe('target-Name')

    // Ensure all edges have unique target handles
    const targetKeys = edgeReport.allEdges.map((e: any) => `${e.target}-${e.targetHandle}`)
    const uniqueTargetKeys = new Set(targetKeys)
    expect(targetKeys.length).toBe(uniqueTargetKeys.size)
  })

  test('allows arbitrary number of input and output ports on GroupNode with routing and removal', async ({ page }) => {
    await page.goto('/')

    // 1. Add Group Node
    await page.getByRole('button', { name: '+ Functions' }).click()
    await page.getByRole('button', { name: '🔳 Group Node' }).click()

    const groupNode = page.locator('.group-node')
    await expect(groupNode).toBeVisible()

    // Position group node cleanly to avoid overlap with preview-pane and other nodes
    await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      const g = pipeline.nodes.value.find((n: any) => n.type === 'group')
      if (g) {
        g.position = { x: 50, y: 350 }
      }
    })

    // Initially 1 input and 1 output
    await expect(groupNode.locator('.inputs-column .input-pair')).toHaveCount(1)
    await expect(groupNode.locator('.outputs-column .output-pair')).toHaveCount(1)

    // Add 2 inputs (total 3)
    const addInputBtn = groupNode.locator('.inputs-column .group-add-btn')
    await addInputBtn.click()
    await addInputBtn.click()
    await expect(groupNode.locator('.inputs-column .input-pair')).toHaveCount(3)

    // Add 1 output (total 2) -> different from inputs!
    const addOutputBtn = groupNode.locator('.outputs-column .group-add-btn')
    await addOutputBtn.click()
    await expect(groupNode.locator('.outputs-column .output-pair')).toHaveCount(2)

    // Check handles exist with correct IDs
    await expect(groupNode.locator('.vue-flow__handle-input')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-internal-input')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-input-1')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-internal-input-1')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-input-2')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-internal-input-2')).toBeVisible()

    await expect(groupNode.locator('.vue-flow__handle-internal-output')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-output')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-internal-output-1')).toBeVisible()
    await expect(groupNode.locator('.vue-flow__handle-output-1')).toBeVisible()

    // Rename second input port to Hersteller
    const input2Label = groupNode.locator('.inputs-column .input-pair').nth(1).locator('.outer-input .port-label-text')
    await expect(input2Label).toHaveText('Input 2')
    await input2Label.dblclick()
    const input2Edit = groupNode.locator('.inputs-column .input-pair').nth(1).locator('.outer-input .port-label-input')
    await input2Edit.fill('Hersteller')
    await input2Edit.press('Enter')
    await expect(input2Label).toHaveText('Hersteller')

    // Remove the 3rd input port (index 2)
    const removeBtn3 = groupNode.locator('.inputs-column .input-pair').nth(2).locator('.group-remove-btn')
    await removeBtn3.click()
    await expect(groupNode.locator('.inputs-column .input-pair')).toHaveCount(2)

    // 2. Upload example.csv to test multi-port data streaming
    const uploadInput = page.locator('header input[type="file"][accept*="csv"]')
    await uploadInput.setInputFiles(path.resolve('example.csv'))

    // Connect stream 1 (Name) through port 0 (input -> internal-input -> internal-output -> output)
    // Connect stream 2 (Hersteller) through port 1 (input-1 -> internal-input-1 -> internal-output-1 -> output-1)
    await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      const gNode = pipeline.nodes.value.find((n: any) => n.type === 'group')
      const gId = gNode?.id
      if (!gId) return

      pipeline.edges.value = [
        // Stream 1
        {
          id: `e-in-Name-${gId}-input`,
          source: 'node_input',
          target: gId,
          sourceHandle: 'Name',
          targetHandle: 'input'
        },
        {
          id: `e-${gId}-internal-input-${gId}-internal-output`,
          source: gId,
          target: gId,
          sourceHandle: 'internal-input',
          targetHandle: 'internal-output'
        },
        {
          id: `e-${gId}-output-node_output-Name`,
          source: gId,
          target: 'node_output',
          sourceHandle: 'output',
          targetHandle: 'target-Name'
        },
        // Stream 2
        {
          id: `e-in-Hersteller-${gId}-input-1`,
          source: 'node_input',
          target: gId,
          sourceHandle: 'Hersteller',
          targetHandle: 'input-1'
        },
        {
          id: `e-${gId}-internal-input-1-${gId}-internal-output-1`,
          source: gId,
          target: gId,
          sourceHandle: 'internal-input-1',
          targetHandle: 'internal-output-1'
        },
        {
          id: `e-${gId}-output-1-node_output-Hersteller`,
          source: gId,
          target: 'node_output',
          sourceHandle: 'output-1',
          targetHandle: 'target-Hersteller'
        }
      ]
    })

    // Verify preview table has data from both streams routed through the multi-port group node
    const previewTable = page.locator('.table-preview table')
    await expect(previewTable).toContainText('Holztisch')
    await expect(previewTable).toContainText('Ikea')

    // 3. Remove input port 1 (Hersteller) and ensure its edges are cleaned up
    const removeBtn2 = groupNode.locator('.inputs-column .input-pair').nth(1).locator('.group-remove-btn')
    await removeBtn2.click()
    await expect(groupNode.locator('.inputs-column .input-pair')).toHaveCount(1)

    // Check that edges attached to input-1 / internal-input-1 were removed
    const remainingEdges = await page.evaluate(() => {
      const pipeline = (window as any).__PIPELINE__
      return pipeline.edges.value
    })
    const hasInput1Edge = remainingEdges.some(
      (e: any) => e.targetHandle === 'input-1' || e.sourceHandle === 'internal-input-1'
    )
    expect(hasInput1Edge).toBe(false)
  })
})

