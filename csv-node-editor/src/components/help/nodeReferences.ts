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

export interface NodeExample {
  inputTitle?: string
  inputHeaders: string[]
  inputRows: string[][]
  detail?: string
  outputHeaders: string[]
  outputRows: string[][]
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
      outputRows: [['Offen'], ['Offen']]
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
      outputRows: [['Länge: 5 m']]
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
      outputRows: [['Rot', 'Grün', 'Blau']]
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
      outputRows: [['A-204']]
    },
    additionalExamples: [
      {
        inputHeaders: ['Fläche'],
        inputRows: [['2,5 m²']],
        detail: 'Für die zwei Ausgabespalten brauchst du zwei Regex Nodes. Verbinde beide mit dem Originalfeld „Fläche“. Node 1 sucht mit dem Muster \\d+(?:,\\d+)? nach Ziffern und optionalen Nachkommastellen und findet „2,5“. Node 2 verwendet das Muster \D+$, um den Einheitstext zu finden. So erkennt es zum Beispiel „m²“, „cm“, „kg“, „°C“ oder „%“. Jeder Treffer erscheint in einer eigenen Spalte.',
        outputHeaders: ['Fläche', 'Einheit'],
        outputRows: [['2,5', 'm²']]
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
      outputRows: [['true'], ['false']]
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
      outputRows: [['kostenlos'], ['kostenpflichtig']]
    },
    additionalExamples: [
      {
        inputHeaders: ['E-Mail-Adresse', 'Dann', 'Sonst'],
        inputRows: [['mira@example.de', 'Adresse vorhanden', 'Adresse fehlt'], ['', 'Adresse vorhanden', 'Adresse fehlt']],
        detail: 'Ein gefülltes Feld ist truthy; ein leeres Feld ist falsy.',
        outputHeaders: ['Ergebnis'],
        outputRows: [['Adresse vorhanden'], ['Adresse fehlt']]
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
      outputRows: [['0171 123456'], ['030 987654']]
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
      outputRows: [['100'], ['110'], ['120']]
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
      outputRows: [['1'], ['2'], ['1'], ['3']]
    },
    additionalExamples: [
      {
        inputHeaders: ['Ort', 'Produkt'],
        inputRows: [['Berlin', 'Tee'], ['Berlin', 'Kaffee'], ['Hamburg', 'Tee'], ['Berlin', 'Tee']],
        detail: 'Die Kombination aus Ort und Produkt erhält eine eindeutige ID.',
        outputHeaders: ['Kombinations-ID'],
        outputRows: [['1'], ['2'], ['3'], ['1']]
      }
    ]
  },
}