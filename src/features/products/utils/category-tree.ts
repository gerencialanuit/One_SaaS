import type { Category } from '@/types/database'
import type { CategoryWithChildren } from '../types'

/** Arma el arbol padre/hijo a partir de la lista plana. Ignora ciclos por seguridad. */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const byId = new Map<string, CategoryWithChildren>(categories.map((c) => [c.id, { ...c, children: [] }]))
  const roots: CategoryWithChildren[] = []

  for (const category of categories) {
    const node = byId.get(category.id)
    if (!node) continue

    if (category.parent_id && byId.has(category.parent_id) && category.parent_id !== category.id) {
      byId.get(category.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/** Aplana el arbol de nuevo, en orden de aparicion, con `depth` para indentar en selects. */
export function flattenCategoryTree(tree: CategoryWithChildren[], depth = 0): { category: Category; depth: number }[] {
  return tree.flatMap((node) => [
    { category: node, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ])
}
