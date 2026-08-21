export interface AvailabilityInfo {
  productId: string
  unitPrice: number
  availableWithQuotes: number
}

export interface IncomingOrder {
  productId: string
  expectedArrivalDate: string
  quantity: number
}

export interface QuoteItemInput {
  productId: string
  quantity: number
}

export interface ItemEstimate {
  productId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  estimatedDeliveryDate: string | null
}

export interface QuoteEstimate {
  items: ItemEstimate[]
  subtotal: number
  estimatedDeliveryDate: string | null
}

function computeItemDeliveryDate(
  quantity: number,
  availableWithQuotes: number,
  productId: string,
  incomingOrders: IncomingOrder[],
  today: string
): string | null {
  if (quantity <= availableWithQuotes) {
    return today
  }

  const shortfall = quantity - availableWithQuotes
  const relevant = incomingOrders
    .filter((order) => order.productId === productId)
    .slice()
    .sort((a, b) => a.expectedArrivalDate.localeCompare(b.expectedArrivalDate))

  let cumulative = 0
  for (const order of relevant) {
    cumulative += order.quantity
    if (cumulative >= shortfall) {
      return order.expectedArrivalDate
    }
  }

  return null
}

export function computeQuoteEstimate(
  quoteItems: QuoteItemInput[],
  availability: AvailabilityInfo[],
  incomingOrders: IncomingOrder[],
  today: string
): QuoteEstimate {
  const availabilityMap = new Map(availability.map((a) => [a.productId, a]))

  const items: ItemEstimate[] = quoteItems.map((quoteItem) => {
    const info = availabilityMap.get(quoteItem.productId)
    const unitPrice = info?.unitPrice ?? 0
    const available = info?.availableWithQuotes ?? 0

    const estimatedDeliveryDate = computeItemDeliveryDate(
      quoteItem.quantity,
      available,
      quoteItem.productId,
      incomingOrders,
      today
    )

    return {
      productId: quoteItem.productId,
      quantity: quoteItem.quantity,
      unitPrice,
      lineTotal: quoteItem.quantity * unitPrice,
      estimatedDeliveryDate,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const hasUndated = items.some((item) => item.estimatedDeliveryDate === null)

  const estimatedDeliveryDate = hasUndated
    ? null
    : items.reduce<string>(
        (max, item) => (item.estimatedDeliveryDate! > max ? item.estimatedDeliveryDate! : max),
        items[0]?.estimatedDeliveryDate ?? today
      )

  return { items, subtotal, estimatedDeliveryDate }
}
