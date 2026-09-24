# CSV Node Editor User Guide

CSV Node Editor helps you turn spreadsheet data into a clean, repeatable result. You upload a file, add processing steps to the canvas, connect those steps, and choose the columns you want in the final output.

## The Basic Workflow

1. Upload a CSV or Excel file.
2. Add the processing nodes you need from `+ Functions`.
3. Connect the ports between nodes.
4. Check the result in the preview table.
5. Download the result as CSV or Excel.
6. Save the working plan if you want to use the same process again.

## Uploading a File

Use `Choose File` in the top bar to upload a `.csv`, `.xls`, or `.xlsx` file.

For Excel workbooks, the first worksheet is used. The column names from the file appear as ports on the Input Node. Each row in the file can then flow through the nodes on the canvas.

The name of the current file appears in the browser tab in this format:

`csv-node-editor - filename.csv`

Uploading another file keeps the processing nodes in place and updates the data flowing through them.

## Understanding the Canvas

The canvas is the main work area. Each box is a node that performs an operation. Nodes have ports on their left and right sides:

- Ports on the left usually receive data.
- Ports on the right usually send data.
- A line between two ports represents a connection.
- Each target port accepts one incoming connection.
- Connecting a new line to an occupied target replaces the old connection.
- Double-click a connection line to remove it.

Drag a node by its background or title to move it. Controls inside a node, such as inputs and buttons, are not part of the node drag.

## Connecting Nodes

To create a connection, drag from an output port to a compatible input port. The editor checks the port direction before accepting the connection.

### Automatic Connections

You can automatically connect ports with the same visible name:

- On Windows and Linux, hold `Ctrl` and click a port.
- On macOS, hold `Command` and click a port.

The editor searches for an opposite port with the same name that is not already connected. If several ports match, they are chosen in id order. Click the same port again with the modifier key held to move to the next available match.

This is useful when a pipeline contains repeated nodes or many columns with similar names.

## Changing Port Names

Many port labels can be renamed by double-clicking the label. Type the new name and confirm it.

Port names are used by automatic connections and file changes. For example, if a node input is renamed to `Customer`, it can automatically connect to a file column named `Customer`.

## Input and Output Nodes

### Input Node

The Input Node represents the uploaded file. It creates one output port for each column and supplies the original row values to the pipeline.

When a different file is uploaded, the Input Node is rebuilt with the new file name and columns.

### Output Node

The Output Node controls the final result. Each output column has a target port and appears as a column in the preview table.

You can:

- Add an output column.
- Remove an output column.
- Rename an output column.
- Reorder output columns by dragging the column name.
- Connect a processing node to a specific output column.

Drag from an output port itself to create a connection. The column name can be dragged for reordering.

#### Pasting Excel Headers

Paste one Excel header row into the `New Column...` field to add all header names at once. Copy the cells directly from Excel so the clipboard contains tab-separated values, for example `Name<TAB>Category<TAB>Price`. Do not include the data rows, commas, or surrounding quotes. Line breaks are also supported, so each header can be pasted on its own line. Blank and duplicate names are ignored.

## Changing Files

When you upload a different file, the editor updates the output schema to match the new file columns by default.

For an unpinned output schema:

- New file columns are added to the output.
- Removed file columns are removed from the output.
- Input and output nodes are connected directly for each current column.
- Existing processing connections are kept when their target still exists.
- A processing connection takes priority over a direct input-to-output connection.

This makes it easy to apply the same pipeline to files with the same general structure.

## Pinning the Output Schema

The Output Node has a `Pin` button. Use it when you want the final result to keep the same columns even when the uploaded file changes.

When the output is pinned:

- The current output columns stay in place.
- New file columns are not automatically added to the output but the columns of the new input node are automatically connected to the pinned output schema (as long as column names are the same).
- The output can act as a stable template for files with changing columns.
- The pin state is included when you save a working plan.

Click `Pinned` again to allow the output to follow future file changes.

## Previewing and Downloading Results

The preview pane shows the values produced by the output connections. Its columns follow the Output Node schema.

Use the preview actions to download:

- A CSV file.
- An Excel `.xlsx` file.

Downloads use the current input file name. For example, uploading `customers.csv` creates:

- `customers.csv`
- `customers.xlsx`

If there is no current file name, the default names are `output.csv` and `output.xlsx`.

## Processing Nodes

### String Node

Creates one fixed text value for every row. Use it for a constant value, a label, a fallback, or test data.

### Combine Strings Node

Combines two text inputs with a separator. For example, it can combine a first name and last name with a space between them.

It has:

- A first text input.
- A second text input.
- A separator input.
- One combined text output.

### Split String Node

Splits one text value into separate parts using a separator. For example, splitting `red|green|blue` with `|` produces three values.

It has:

- One text input.
- One separator input.
- Multiple output ports.

Use `+ Output` to add more output ports when the input can contain more parts. If a row does not contain a value for an output position, that output is empty.

### Regex Node

Uses a regular expression to inspect or change text. It supports filtering matches and replacing matching text.

Use it to find patterns such as numbers, codes, words, or formatted identifiers.

### Compare Node

Compares two values and produces a true or false result. Use it when a later If Node should make a decision based on two values.

### If Node

Chooses between a `Then` value and an `Else` value based on a condition. It is useful for creating conditional output values.

### Counter Node

Creates a sequence of values. You can choose a starting value and a step amount, or use an input value as the starting point.

### Unique Count Node

Counts unique combinations of its inputs. It is useful for assigning counts to distinct values or combinations of columns.

Additional input ports can be added when more values should be included in the combination.

### Coalesce Node

Checks several inputs and returns the first non-empty value. Use it to provide fallback values when a preferred column is blank.

### Join Node

Collects several text inputs into an array. Add input ports when more values should be included.

### Split Node

Takes an array and exposes individual array items through separate output ports. Use it when another node has produced an array and you need its individual elements.

## Groups

A Group Node is a container for several related nodes. Groups are useful when a part of a pipeline should be kept together or reused.

To place a node inside a group, drag it completely inside the group boundaries. Nodes inside the group can still be connected and edited.

Groups can have multiple input and output ports. You can add, remove, and rename these ports. The group background stays behind its internal connections so the connections remain usable.

Deleting a group also deletes the nodes inside it.

## Group Presets

You can save a configured group as a preset using the `Preset` button on the group.

A saved preset can be used in two ways:

- A compact preset node exposes the preset as one reusable operation.
- An expanded preset recreates the group, its child nodes, and its internal connections.

Presets are useful for repeating the same transformation in several pipelines.

## Saving and Loading Work

Use `Save working file` to save the current plan as a JSON file. The saved plan includes:

- The current file information.
- Nodes and their positions.
- Connections.
- Renamed ports.
- Groups and group children.
- Output columns and their order.
- The output pin state.

Use `Load working file` to restore a saved plan and continue working where you left off.

## Preview Layout

The preview can be displayed on the right side of the editor or below the canvas.
Use the preview orientation button to switch between the right-side and bottom layouts.

You can resize the preview by dragging the divider. Double-click the divider to restore its default size. When the divider is focused, the arrow keys can also adjust the preview size.

## Removing Nodes

Select a node and press `Delete` or `Backspace` to remove it.

Deleting the Input Node also removes the Output Node and their related connections, but keeps other processing and group nodes on the canvas. This allows the remaining pipeline to be reused with another file.

Deleting a Group Node also removes its child nodes.

## Starting the App

If you are running the project locally:

```bash
pnpm install
pnpm dev
```

Then open the local address shown by the development server in your browser.
