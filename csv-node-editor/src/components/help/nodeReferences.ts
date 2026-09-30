export type NodeReferenceKey =
  | 'string'
  | 'combineStrings'
  | 'splitString'
  | 'regex'
  | 'compare'
  | 'if'
  | 'coalesce'
  | 'counter'
  | 'uniqueCount'

export interface ExampleCanvasNode {
  id: string
  type: string
  data: Record<string, any>
}

export interface ExampleCanvasEdge {
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
}

export interface NodeExample {
  inputTitle?: string
  inputHeaders: string[]
  inputRows: string[][]
  detail?: string
  outputHeaders: string[]
  outputRows: string[][]
  canvasNodes: ExampleCanvasNode[]
  canvasEdges: ExampleCanvasEdge[]
}

export interface NodeReference {
  title: string
  summary: string
  useCase: string
  inputs: string[]
  outputs: string[]
  note?: string
  example: NodeExample
  additionalExamples?: NodeExample[]
}

export const nodeReferences: Record<NodeReferenceKey, NodeReference> = {
  string: {
    title: 'String Node',
    summary: 'Setzt in jede Zeile denselben Text ein.',
    useCase: 'Zum Beispiel ein Etikett, ein Standardwert oder ein Ersatztext, wenn sonst nichts vorhanden ist.',
    inputs: ['Keine. Den Text tippst du direkt in diesen Baustein ein.'],
    outputs: ['Der eingegebene Text, für jede Zeile gleich.'],
    example: {
      inputTitle: 'CSV-Zeilen',
      inputHeaders: ['Zeile'],
      inputRows: [['1'], ['2']],
      detail: 'Festtext: „Offen“',
      outputHeaders: ['Status'],
      outputRows: [['Offen'], ['Offen']],
      canvasNodes: [
        { id: 'string', type: 'string', data: { value: 'Offen', label: 'String' } }
      ],
      canvasEdges: [
        { source: 'string', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Status' }
      ]
    }
  },
  combineStrings: {
    title: 'Combine Strings Node',
    summary: 'Verbindet zwei Texte zu einem gemeinsamen Text.',
    useCase: 'Zum Beispiel Vor- und Nachnamen mit einem Leerzeichen verbinden.',
    inputs: ['Input 1: der erste Text.', 'Input 2: der zweite Text.', 'Separator Input: das Zeichen oder der Text dazwischen, zum Beispiel ein Leerzeichen.'],
    outputs: ['Ein Text mit beiden Werten.'],
    example: {
      inputHeaders: ['Input 1', 'Input 2', 'Trennzeichen'],
      inputRows: [['Länge', '5 m', ': ']],
      outputHeaders: ['Kombinierter Text'],
      outputRows: [['Länge: 5 m']],
      canvasNodes: [
        { id: 'combine', type: 'combine', data: { label: 'Combine Strings' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Input 1', target: 'combine', targetHandle: 'string1' },
        { source: 'node_input', sourceHandle: 'Input 2', target: 'combine', targetHandle: 'string2' },
        { source: 'node_input', sourceHandle: 'Trennzeichen', target: 'combine', targetHandle: 'separator' },
        { source: 'combine', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Kombinierter Text' }
      ]
    }
  },
  splitString: {
    title: 'Split String Node',
    summary: 'Teilt einen Text an einem Zeichen oder Wort und gibt die Teile getrennt aus.',
    useCase: 'Zum Beispiel „Rot|Grün|Blau“ an den senkrechten Strichen in drei Werte teilen.',
    inputs: ['Input: der Text, der geteilt werden soll.', 'Separator Input: das Zeichen oder Wort, an dem geteilt wird.'],
    outputs: ['Jeder Teil erscheint einzeln. Gibt es in einer Zeile weniger Teile, bleiben die übrigen Ausgaben leer.'],
    note: 'Mit „+ Output“ kannst du weitere Ausgaben hinzufügen.',
    example: {
      inputHeaders: ['Text', 'Trennzeichen'],
      inputRows: [['Rot|Grün|Blau', '|']],
      outputHeaders: ['Teil 1', 'Teil 2', 'Teil 3'],
      outputRows: [['Rot', 'Grün', 'Blau']],
      canvasNodes: [
        { id: 'split-string', type: 'splitString', data: { outputCount: 3, label: 'Split String' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Text', target: 'split-string', targetHandle: 'input' },
        { source: 'node_input', sourceHandle: 'Trennzeichen', target: 'split-string', targetHandle: 'separator' },
        { source: 'split-string', sourceHandle: 'output-0', target: 'node_output', targetHandle: 'target-Teil 1' },
        { source: 'split-string', sourceHandle: 'output-1', target: 'node_output', targetHandle: 'target-Teil 2' },
        { source: 'split-string', sourceHandle: 'output-2', target: 'node_output', targetHandle: 'target-Teil 3' }
      ]
    }
  },
  regex: {
    title: 'Regex Node',
    summary: 'Findet bestimmte Stellen in einem Text und kann sie herauslösen oder ersetzen.',
    useCase: 'Zum Beispiel eine Nummer, einen Code oder eine E-Mail-Adresse in einem längeren Text finden.',
    inputs: ['Input: der Text, in dem gesucht oder etwas ersetzt werden soll.', 'Du gibst außerdem an, wonach gesucht werden soll.'],
    outputs: ['Der gefundene Text oder der Text nach dem Ersetzen.'],
    note: 'Das Flag „i“ ignoriert Groß- und Kleinschreibung. Ist es aktiviert, findet das Muster „haus“ als auch „Haus“ oder „HAUS“.',
    example: {
      inputHeaders: ['Text'],
      inputRows: [['Bestellung A-204 wurde versendet']],
      detail: 'Muster: [A-Z]-\\d+ · Modus: Treffer finden',
      outputHeaders: ['Treffer'],
      outputRows: [['A-204']],
      canvasNodes: [
        { id: 'regex', type: 'regex', data: { pattern: '[A-Z]-\\d+', replacement: '', mode: 'match', flags: '', label: 'Regex: Bestellcode' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Text', target: 'regex', targetHandle: 'input' },
        { source: 'regex', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Treffer' }
      ]
    },
    additionalExamples: [
      {
        inputHeaders: ['Fläche'],
        inputRows: [['2,5 m²']],
        detail: 'Für die zwei Ausgabespalten brauchst du zwei Regex Nodes. Verbinde beide mit dem Originalfeld „Fläche“. Node 1 sucht mit dem Muster \\d+(?:,\\d+)? nach Ziffern und optionalen Nachkommastellen und findet „2,5“. Node 2 verwendet das Muster \D+$, um den Einheitstext zu finden. So erkennt es zum Beispiel „m²“, „cm“, „kg“, „°C“ oder „%“. Jeder Treffer erscheint in einer eigenen Spalte.',
        outputHeaders: ['Fläche', 'Einheit'],
        outputRows: [['2,5', 'm²']],
        canvasNodes: [
          { id: 'regex-value', type: 'regex', data: { pattern: '\\d+(?:,\\d+)?', replacement: '', mode: 'match', flags: '', label: 'Regex: Zahl' } },
          { id: 'regex-unit', type: 'regex', data: { pattern: '\\S+$', replacement: '', mode: 'match', flags: '', label: 'Regex: Einheit' } }
        ],
        canvasEdges: [
          { source: 'node_input', sourceHandle: 'Fläche', target: 'regex-value', targetHandle: 'input' },
          { source: 'node_input', sourceHandle: 'Fläche', target: 'regex-unit', targetHandle: 'input' },
          { source: 'regex-value', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Fläche' },
          { source: 'regex-unit', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Einheit' }
        ]
      }
    ]
  },
  compare: {
    title: 'Compare Node',
    summary: 'Prüft zwei Werte und sagt, ob sie gleich sind oder eine andere Regel erfüllen.',
    useCase: 'Zum Beispiel prüfen, ob ein Ort „Berlin“ ist oder ob zwei Zahlen gleich sind.',
    inputs: ['Input A und Input B: die beiden Werte, die du prüfen möchtest.'],
    outputs: ['Das Ergebnis der Prüfung: „Ja“ oder „Nein“ (true oder false).'],
    note: 'Tipp: Verbinde den Compare Node mit dem If Node. Das true/false-Ergebnis des Vergleichs kann dort als Condition dienen, um unterschiedliche Werte auszugeben.',
    example: {
      inputHeaders: ['Wert A', 'Wert B'],
      inputRows: [['Berlin', 'Berlin'], ['Hamburg', 'Berlin']],
      detail: 'Vergleich: ist gleich',
      outputHeaders: ['Ergebnis'],
      outputRows: [['true'], ['false']],
      canvasNodes: [
        { id: 'compare', type: 'compare', data: { operator: 'equals', label: 'Compare: gleich?' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Wert A', target: 'compare', targetHandle: 'leftString' },
        { source: 'node_input', sourceHandle: 'Wert B', target: 'compare', targetHandle: 'rightString' },
        { source: 'compare', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Ergebnis' }
      ]
    }
  },
  if: {
    title: 'If Node',
    summary: 'Wählt einen von zwei Werten aus, je nachdem, ob die Bedingung als wahr oder falsch gilt.',
    useCase: 'Zum Beispiel einen Rabatt ausgeben, wenn eine Bestellung groß genug ist, sonst keinen Rabatt.',
    inputs: ['Condition: „true“ oder „false“ (Groß-/Kleinschreibung egal). Andere gefüllte Textwerte gelten als wahr, ein leerer Wert als falsch.', 'Then: der Wert, wenn Condition als wahr gilt.', 'Else: der Wert, wenn Condition als falsch gilt.'],
    outputs: ['Der Then-Wert, wenn die Bedingung wahr ist, sonst der Else-Wert.'],
    example: {
      inputHeaders: ['Bedingung (Text)', 'Dann', 'Sonst'],
      inputRows: [['true', 'kostenlos', 'kostenpflichtig'], ['FALSE', 'kostenlos', 'kostenpflichtig']],
      detail: 'Die Werte „true“ und „false“ werden als boolische Werte interpretiert. Bei allen anderen Werten gelten gefüllte Textfelder als wahr, ein leere Zelle als falsch.',
      outputHeaders: ['Versandkosten'],
      outputRows: [['kostenlos'], ['kostenpflichtig']],
      canvasNodes: [
        { id: 'if', type: 'if', data: { label: 'If' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Bedingung (Text)', target: 'if', targetHandle: 'condition' },
        { source: 'node_input', sourceHandle: 'Dann', target: 'if', targetHandle: 'then' },
        { source: 'node_input', sourceHandle: 'Sonst', target: 'if', targetHandle: 'else' },
        { source: 'if', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Versandkosten' }
      ]
    },
    additionalExamples: [
      {
        inputHeaders: ['E-Mail-Adresse', 'Dann', 'Sonst'],
        inputRows: [['mira@example.de', 'Adresse vorhanden', 'Adresse fehlt'], ['', 'Adresse vorhanden', 'Adresse fehlt']],
        detail: 'Ein gefülltes Feld ist truthy; ein leeres Feld ist falsy.',
        outputHeaders: ['Ergebnis'],
        outputRows: [['Adresse vorhanden'], ['Adresse fehlt']],
        canvasNodes: [
          { id: 'if', type: 'if', data: { label: 'If: E-Mail vorhanden?' } }
        ],
        canvasEdges: [
          { source: 'node_input', sourceHandle: 'E-Mail-Adresse', target: 'if', targetHandle: 'condition' },
          { source: 'node_input', sourceHandle: 'Dann', target: 'if', targetHandle: 'then' },
          { source: 'node_input', sourceHandle: 'Sonst', target: 'if', targetHandle: 'else' },
          { source: 'if', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Ergebnis' }
        ]
      }
    ]
  },
  coalesce: {
    title: 'Coalesce Node',
    summary: 'Geht mehrere Werte der Reihe nach durch und nimmt den ersten, der ausgefüllt ist.',
    useCase: 'Zum Beispiel zuerst die Handynummer verwenden, wenn sie fehlt die Festnetznummer.',
    inputs: ['Verbinde die Werte in der Reihenfolge, in der sie bevorzugt werden.'],
    outputs: ['Der erste vorhandene Wert.'],
    note: 'Soll auch dann ein Wert erscheinen, wenn alle Felder leer sind? Hänge am Ende einen String Node mit einem Ersatztext an.',
    example: {
      inputHeaders: ['Handy', 'Festnetz'],
      inputRows: [['0171 123456', '030 987654'], ['', '030 987654']],
      outputHeaders: ['Telefon'],
      outputRows: [['0171 123456'], ['030 987654']],
      canvasNodes: [
        { id: 'coalesce', type: 'coalesce', data: { inputCount: 2, label: 'Coalesce: erste Nummer' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Handy', target: 'coalesce', targetHandle: 'input-0' },
        { source: 'node_input', sourceHandle: 'Festnetz', target: 'coalesce', targetHandle: 'input-1' },
        { source: 'coalesce', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Telefon' }
      ]
    }
  },
  counter: {
    title: 'Counter Node',
    summary: 'Gibt jeder Zeile der Reihe nach eine Nummer.',
    useCase: 'Zum Beispiel Zeilen nummerieren oder fortlaufende Kennnummern erstellen.',
    inputs: ['Lege fest, mit welcher Zahl begonnen wird und um wie viel die nächste Zahl steigt.'],
    outputs: ['Die Nummer für die jeweilige Zeile.'],
    example: {
      inputTitle: 'CSV-Zeilen',
      inputHeaders: ['Zeile'],
      inputRows: [['1'], ['2'], ['3']],
      detail: 'Startwert: 100 · Schrittweite: 10',
      outputHeaders: ['Laufende Nummer'],
      outputRows: [['100'], ['110'], ['120']],
      canvasNodes: [
        { id: 'counter', type: 'counter', data: { startMode: 'manual', startValue: 100, step: 10, label: 'Counter' } }
      ],
      canvasEdges: [
        { source: 'counter', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Laufende Nummer' }
      ]
    }
  },
  uniqueCount: {
    title: 'Unique Count Node',
    summary: 'Zählt, wie oft ein Wert oder eine Kombination von Werten vorkommt.',
    useCase: 'Zum Beispiel herausfinden, wie oft jede Produktart oder jede Kombination aus Ort und Produkt vorkommt.',
    inputs: ['Verbinde eine oder mehrere Spalten. Mit „+ Port“ kannst du weitere Spalten hinzufügen.'],
    outputs: ['Die Nummer des bisherigen Vorkommens dieses Werts oder dieser Kombination.'],
    example: {
      inputHeaders: ['Produkt'],
      inputRows: [['Tee'], ['Kaffee'], ['Tee'], ['Saft']],
      detail: 'Modus: Eindeutige ID · Startwert: 1 · Schrittweite: 1',
      outputHeaders: ['Produkt-ID'],
      outputRows: [['1'], ['2'], ['1'], ['3']],
      canvasNodes: [
        { id: 'unique-count', type: 'uniqueCountNode', data: { startMode: 'manual', startValue: 1, step: 1, inputCount: 1, mode: 'id', label: 'Unique Count' } }
      ],
      canvasEdges: [
        { source: 'node_input', sourceHandle: 'Produkt', target: 'unique-count', targetHandle: 'input-0' },
        { source: 'unique-count', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Produkt-ID' }
      ]
    },
    additionalExamples: [
      {
        inputHeaders: ['Ort', 'Produkt'],
        inputRows: [['Berlin', 'Tee'], ['Berlin', 'Kaffee'], ['Hamburg', 'Tee'], ['Berlin', 'Tee']],
        detail: 'Die Kombination aus Ort und Produkt erhält eine eindeutige ID.',
        outputHeaders: ['Kombinations-ID'],
        outputRows: [['1'], ['2'], ['3'], ['1']],
        canvasNodes: [
          { id: 'unique-count', type: 'uniqueCountNode', data: { startMode: 'manual', startValue: 1, step: 1, inputCount: 2, mode: 'id', label: 'Unique Count: Kombination' } }
        ],
        canvasEdges: [
          { source: 'node_input', sourceHandle: 'Ort', target: 'unique-count', targetHandle: 'input-0' },
          { source: 'node_input', sourceHandle: 'Produkt', target: 'unique-count', targetHandle: 'input-1' },
          { source: 'unique-count', sourceHandle: 'output', target: 'node_output', targetHandle: 'target-Kombinations-ID' }
        ]
      }
    ]
  },
}