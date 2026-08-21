export interface ZoneGroup<T> {
  zoneName: string
  items: T[]
}

const NO_ZONE_LABEL = 'Sin zona'

export function groupByZone<T extends { zone_name?: string | null }>(items: T[]): ZoneGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.zone_name || NO_ZONE_LABEL
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return Array.from(map.entries()).map(([zoneName, groupItems]) => ({ zoneName, items: groupItems }))
}
