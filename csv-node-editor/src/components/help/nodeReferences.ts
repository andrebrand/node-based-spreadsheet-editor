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

export interface NodeReference {
  title: string
  summary: string
  useCase: string
  inputs: string[]
  outputs: string[]
  note?: string
}

export const nodeReferences: Record<NodeReferenceKey, NodeReference> = {
  string: {
    title: 'String Node',
    summary: 'Setzt in jede Zeile denselben Text ein.',
    useCase: 'Zum Beispiel ein Etikett, ein Standardwert oder ein Ersatztext, wenn sonst nichts vorhanden ist.',
    inputs: ['Keine. Den Text tippst du direkt in diesen Baustein ein.'],
    outputs: ['Der eingegebene Text, für jede Zeile gleich.']
  },
  combineStrings: {
    title: 'Combine Strings Node',
    summary: 'Verbindet zwei Texte zu einem gemeinsamen Text.',
    useCase: 'Zum Beispiel Vor- und Nachnamen mit einem Leerzeichen verbinden.',
    inputs: ['Input 1: der erste Text.', 'Input 2: der zweite Text.', 'Separator Input: das Zeichen oder der Text dazwischen, zum Beispiel ein Leerzeichen.'],
    outputs: ['Ein Text mit beiden Werten.']
  },
  splitString: {
    title: 'Split String Node',
    summary: 'Teilt einen Text an einem Zeichen oder Wort und gibt die Teile getrennt aus.',
    useCase: 'Zum Beispiel „Rot|Grün|Blau“ an den senkrechten Strichen in drei Werte teilen.',
    inputs: ['Input: der Text, der geteilt werden soll.', 'Separator Input: das Zeichen oder Wort, an dem geteilt wird.'],
    outputs: ['Jeder Teil erscheint einzeln. Gibt es in einer Zeile weniger Teile, bleiben die übrigen Ausgaben leer.'],
    note: 'Mit „+ Output“ kannst du weitere Ausgaben hinzufügen.'
  },
  regex: {
    title: 'Regex Node',
    summary: 'Findet bestimmte Stellen in einem Text und kann sie herauslösen oder ersetzen.',
    useCase: 'Zum Beispiel eine Nummer, einen Code oder eine E-Mail-Adresse in einem längeren Text finden.',
    inputs: ['Input: der Text, in dem gesucht oder etwas ersetzt werden soll.', 'Du gibst außerdem an, wonach gesucht werden soll.'],
    outputs: ['Der gefundene Text oder der Text nach dem Ersetzen.']
  },
  compare: {
    title: 'Compare Node',
    summary: 'Prüft zwei Werte und sagt, ob sie gleich sind oder eine andere Regel erfüllen.',
    useCase: 'Zum Beispiel prüfen, ob ein Ort „Berlin“ ist oder ob zwei Zahlen gleich sind.',
    inputs: ['Input A und Input B: die beiden Werte, die du prüfen möchtest.'],
    outputs: ['Das Ergebnis der Prüfung: „Ja“ oder „Nein“ (true oder false).']
  },
  if: {
    title: 'If Node',
    summary: 'Wählt zwischen zwei Werten: einem, wenn eine Prüfung zutrifft, und einem anderen, wenn nicht.',
    useCase: 'Zum Beispiel einen Rabatt ausgeben, wenn eine Bestellung groß genug ist, sonst keinen Rabatt.',
    inputs: ['Condition: das Ergebnis einer Prüfung, zum Beispiel „Ja“ oder „Nein“.', 'Then: der Wert, der bei „Ja“ verwendet wird.', 'Else: der Wert, der bei „Nein“ verwendet wird.'],
    outputs: ['Der Wert, der zur Antwort der Prüfung passt.']
  },
  coalesce: {
    title: 'Coalesce Node',
    summary: 'Geht mehrere Werte der Reihe nach durch und nimmt den ersten, der ausgefüllt ist.',
    useCase: 'Zum Beispiel zuerst die Handynummer verwenden, wenn sie fehlt die Festnetznummer.',
    inputs: ['Verbinde die Werte in der Reihenfolge, in der sie bevorzugt werden.'],
    outputs: ['Der erste vorhandene Wert.'],
    note: 'Soll auch dann ein Wert erscheinen, wenn alle Felder leer sind? Hänge am Ende einen String Node mit einem Ersatztext an.'
  },
  counter: {
    title: 'Counter Node',
    summary: 'Gibt jeder Zeile der Reihe nach eine Nummer.',
    useCase: 'Zum Beispiel Zeilen nummerieren oder fortlaufende Kennnummern erstellen.',
    inputs: ['Lege fest, mit welcher Zahl begonnen wird und um wie viel die nächste Zahl steigt.'],
    outputs: ['Die Nummer für die jeweilige Zeile.']
  },
  uniqueCount: {
    title: 'Unique Count Node',
    summary: 'Zählt, wie oft ein Wert oder eine Kombination von Werten vorkommt.',
    useCase: 'Zum Beispiel herausfinden, wie oft jede Produktart oder jede Kombination aus Ort und Produkt vorkommt.',
    inputs: ['Verbinde eine oder mehrere Spalten. Mit „+ Port“ kannst du weitere Spalten hinzufügen.'],
    outputs: ['Die Nummer des bisherigen Vorkommens dieses Werts oder dieser Kombination.']
  },
}