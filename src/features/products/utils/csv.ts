/** Parser/generador CSV minimo (RFC4180: comillas dobles, escapado con "" ) sin dependencias externas. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      pushField()
    } else if (char === '\n') {
      pushRow()
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow()
  }

  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''))
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const row of rows) {
    lines.push(row.map((v) => escapeCsvField(v == null ? '' : String(v))).join(','))
  }
  return lines.join('\r\n')
}

export function parseCsvRecords(text: string): Record<string, string>[] {
  const [headerRow, ...rows] = parseCsv(text)
  if (!headerRow) return []
  const headers = headerRow.map((h) => h.trim())
  return rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, (row[i] ?? '').trim()])))
}
