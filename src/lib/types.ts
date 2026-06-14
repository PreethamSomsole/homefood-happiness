export type TimestampSource = 'provided' | 'provided_date_estimated_time' | 'inferred'
export type PaymentMethod = 'cash' | 'card' | 'zelle' | 'unknown'

export interface Product {
  id: string
  name: string
  active: boolean
}

export interface ProductPrice {
  id: string
  productId: string
  priceCents: number
  effectiveAt: string
  timestampSource: TimestampSource
}

export interface OrderLine {
  id: string
  productId: string
  quantity: number
  unitPriceCents: number
}

export type OrderStatus = 'paid' | 'payment_pending' | 'pickup_pending'

export interface CustomerOrder {
  id: string
  customerName: string
  orderedAt: string
  orderedAtSource: TimestampSource
  preparedAt: string
  preparedAtSource: TimestampSource
  fulfilledAt?: string
  fulfilledAtSource?: TimestampSource
  paidAt?: string
  paidAtSource?: TimestampSource
  paymentMethod: PaymentMethod
  status: OrderStatus
  lines: OrderLine[]
}

export interface Expense {
  id: string
  item: string
  amountCents: number
  paidBy: string
  occurredAt: string
  occurredAtSource: TimestampSource
  paymentMethod: PaymentMethod
}

export interface DatabaseMeta {
  id: string
  value: string
}

export interface BusinessData {
  products: Product[]
  productPrices: ProductPrice[]
  orders: CustomerOrder[]
  expenses: Expense[]
}
