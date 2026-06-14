import type { BusinessData, CustomerOrder, Expense, OrderLine, ProductPrice, TimestampSource } from './types'

const PROVIDED: TimestampSource = 'provided_date_estimated_time'
const INFERRED: TimestampSource = 'inferred'

const productNames = ['Karappusa', 'Chekkalu', 'Prawn Pickle', 'Chicken Pickle', 'Kajjikayalu', 'Janthikalu']

export const products = productNames.map((name) => ({
  id: name.toLowerCase().replaceAll(' ', '-'),
  name,
  active: true,
}))

const productId = (name: string) => name.toLowerCase().replaceAll(' ', '-')
const line = (id: string, product: string, quantity: number, unitPriceCents: number): OrderLine => ({
  id,
  productId: productId(product),
  quantity,
  unitPriceCents,
})

function order(
  id: string,
  customerName: string,
  orderedAt: string,
  preparedAt: string,
  fulfilledAt: string | undefined,
  paidAt: string | undefined,
  status: CustomerOrder['status'],
  lines: OrderLine[],
  source: TimestampSource,
): CustomerOrder {
  return {
    id,
    customerName,
    orderedAt,
    orderedAtSource: source,
    preparedAt,
    preparedAtSource: source,
    fulfilledAt,
    fulfilledAtSource: fulfilledAt ? source : undefined,
    paidAt,
    paidAtSource: paidAt ? source : undefined,
    paymentMethod: 'unknown',
    status,
    lines,
  }
}

export const productPrices: ProductPrice[] = [
  ['karappusa', 500, '2026-05-26T18:00:00-04:00', PROVIDED],
  ['karappusa', 800, '2026-06-09T18:00:00-04:00', INFERRED],
  ['chekkalu', 500, '2026-05-26T18:00:00-04:00', PROVIDED],
  ['chekkalu', 600, '2026-06-02T18:00:00-04:00', INFERRED],
  ['chekkalu', 800, '2026-06-09T18:00:00-04:00', INFERRED],
  ['prawn-pickle', 1500, '2026-05-26T18:00:00-04:00', PROVIDED],
  ['chicken-pickle', 1200, '2026-05-26T18:00:00-04:00', PROVIDED],
  ['kajjikayalu', 100, '2026-06-02T18:00:00-04:00', INFERRED],
  ['janthikalu', 500, '2026-06-02T18:00:00-04:00', INFERRED],
  ['janthikalu', 800, '2026-06-09T18:00:00-04:00', INFERRED],
].map(([id, price, date, source], index) => ({
  id: `price-${index + 1}`,
  productId: String(id),
  priceCents: Number(price),
  effectiveAt: String(date),
  timestampSource: source as TimestampSource,
}))

export const orders: CustomerOrder[] = [
  order('order-1', 'Anusha Srikanth', '2026-05-26T18:00:00-04:00', '2026-05-29T17:00:00-04:00', '2026-05-31T12:00:00-04:00', '2026-05-31T12:00:00-04:00', 'paid', [
    line('line-1', 'Karappusa', 1, 500), line('line-2', 'Chekkalu', 1, 500), line('line-3', 'Prawn Pickle', 1, 1500),
  ], PROVIDED),
  order('order-2', 'Sonali', '2026-05-26T18:00:00-04:00', '2026-05-29T17:00:00-04:00', '2026-05-31T12:00:00-04:00', '2026-05-31T12:00:00-04:00', 'paid', [line('line-4', 'Karappusa', 1, 500)], PROVIDED),
  order('order-3', 'Harshita', '2026-05-26T18:00:00-04:00', '2026-05-29T17:00:00-04:00', '2026-05-31T12:00:00-04:00', '2026-05-31T12:00:00-04:00', 'paid', [
    line('line-5', 'Karappusa', 1, 500), line('line-6', 'Chicken Pickle', 1, 1200),
  ], PROVIDED),
  order('order-4', 'Subhashini', '2026-06-02T18:00:00-04:00', '2026-06-05T17:00:00-04:00', '2026-06-07T12:00:00-04:00', '2026-06-07T12:00:00-04:00', 'paid', [
    line('line-7', 'Kajjikayalu', 6, 100), line('line-8', 'Karappusa', 1, 500), line('line-9', 'Chekkalu', 1, 500),
  ], INFERRED),
  order('order-5', 'Anusha Srikanth', '2026-06-02T18:00:00-04:00', '2026-06-05T17:00:00-04:00', '2026-06-07T12:00:00-04:00', '2026-06-07T12:00:00-04:00', 'paid', [
    line('line-10', 'Karappusa', 1, 500), line('line-11', 'Janthikalu', 1, 500), line('line-12', 'Chekkalu', 1, 500),
  ], INFERRED),
  order('order-6', 'Anusha Macha', '2026-06-02T18:00:00-04:00', '2026-06-05T17:00:00-04:00', '2026-06-07T12:00:00-04:00', '2026-06-07T12:00:00-04:00', 'paid', [
    line('line-13', 'Chicken Pickle', 1, 1200), line('line-14', 'Prawn Pickle', 1, 1500), line('line-15', 'Karappusa', 1, 500), line('line-16', 'Janthikalu', 1, 500),
  ], INFERRED),
  order('order-7', 'Purnima', '2026-06-02T18:00:00-04:00', '2026-06-05T17:00:00-04:00', '2026-06-07T12:00:00-04:00', '2026-06-07T12:00:00-04:00', 'paid', [
    line('line-17', 'Karappusa', 1, 500), line('line-18', 'Chekkalu', 1, 600),
  ], INFERRED),
  order('order-8', 'Aruna', '2026-06-02T18:00:00-04:00', '2026-06-05T17:00:00-04:00', '2026-06-07T12:00:00-04:00', '2026-06-07T12:00:00-04:00', 'paid', [line('line-19', 'Chicken Pickle', 1, 1200)], INFERRED),
  order('order-9', 'Sonali', '2026-06-09T18:00:00-04:00', '2026-06-12T17:00:00-04:00', '2026-06-12T18:00:00-04:00', undefined, 'payment_pending', [
    line('line-20', 'Karappusa', 1, 800), line('line-21', 'Janthikalu', 1, 800),
  ], INFERRED),
  order('order-10', 'Bhavani', '2026-06-09T18:00:00-04:00', '2026-06-12T17:00:00-04:00', undefined, undefined, 'pickup_pending', [
    line('line-22', 'Karappusa', 1, 800), line('line-23', 'Chekkalu', 1, 800),
  ], INFERRED),
]

const expense = (id: string, item: string, amountCents: number, paidBy: string, occurredAt: string, occurredAtSource: TimestampSource): Expense => ({
  id, item, amountCents, paidBy, occurredAt, occurredAtSource, paymentMethod: 'unknown',
})

export const expenses: Expense[] = [
  expense('expense-1', 'Food scale', 699, 'NT', '2026-05-26T18:00:00-04:00', INFERRED),
  expense('expense-2', 'Walmart', 1342, 'NT', '2026-05-26T18:15:00-04:00', INFERRED),
  expense('expense-3', 'Oil + garlic', 2000, 'NT', '2026-05-26T18:30:00-04:00', INFERRED),
  expense('expense-4', 'Spresh', 9409, 'NT', '2026-05-26T18:45:00-04:00', INFERRED),
  expense('expense-5', "BJ's", 2552, 'NT', '2026-05-26T19:00:00-04:00', INFERRED),
  expense('expense-6', 'Rice flour', 569, 'SG', '2026-06-02T18:00:00-04:00', INFERRED),
  expense('expense-7', 'Gram flour', 499, 'NT', '2026-06-02T18:15:00-04:00', INFERRED),
  expense('expense-8', 'Sesame seeds', 100, 'NT', '2026-06-02T18:30:00-04:00', INFERRED),
  expense('expense-9', 'Rice flour', 899, 'NT', '2026-06-09T18:00:00-04:00', INFERRED),
  expense('expense-10', 'Besan flour', 649, 'NT', '2026-06-09T18:15:00-04:00', INFERRED),
  expense('expense-11', 'Peanut oil', 5596, 'Business', '2026-06-14T10:00:00-04:00', PROVIDED),
]

export const seedData: BusinessData = { products, productPrices, orders, expenses }
