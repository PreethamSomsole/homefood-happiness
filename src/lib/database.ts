import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { seedData } from './seed-data'
import type { BusinessData, CustomerOrder, DatabaseMeta, Expense, Product, ProductPrice } from './types'

const DATABASE_NAME = 'homefood-happiness'
const DATABASE_VERSION = 1
const SEED_ID = 'spreadsheet-seed-v2'

interface HomefoodDatabase extends DBSchema {
  products: { key: string; value: Product }
  productPrices: { key: string; value: ProductPrice }
  orders: { key: string; value: CustomerOrder }
  expenses: { key: string; value: Expense }
  meta: { key: string; value: DatabaseMeta }
}

let databasePromise: Promise<IDBPDatabase<HomefoodDatabase>> | null = null
let seedPromise: Promise<void> | null = null

function getDatabase(): Promise<IDBPDatabase<HomefoodDatabase>> {
  if (!databasePromise) {
    databasePromise = openDB<HomefoodDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('products')) database.createObjectStore('products', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('productPrices')) database.createObjectStore('productPrices', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('orders')) database.createObjectStore('orders', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('expenses')) database.createObjectStore('expenses', { keyPath: 'id' })
        if (!database.objectStoreNames.contains('meta')) database.createObjectStore('meta', { keyPath: 'id' })
      },
      blocked() {
        databasePromise = null
      },
      terminated() {
        databasePromise = null
        seedPromise = null
      },
    })
  }
  return databasePromise
}

async function seedIfNeeded(database: IDBPDatabase<HomefoodDatabase>): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      if (await database.get('meta', SEED_ID)) return

      const transaction = database.transaction(['products', 'productPrices', 'orders', 'expenses', 'meta'], 'readwrite')
      await Promise.all([
        ...seedData.products.map((product) => transaction.objectStore('products').put(product)),
        ...seedData.productPrices.map((price) => transaction.objectStore('productPrices').put(price)),
        ...seedData.orders.map((order) => transaction.objectStore('orders').put(order)),
        ...seedData.expenses.map((expense) => transaction.objectStore('expenses').put(expense)),
        transaction.objectStore('meta').put({ id: SEED_ID, value: new Date().toISOString() }),
      ])
      await transaction.done
    })().catch((error) => {
      seedPromise = null
      throw error
    })
  }
  return seedPromise
}

export async function loadBusinessData(): Promise<BusinessData> {
  const database = await getDatabase()
  await seedIfNeeded(database)
  const [products, productPrices, orders, expenses] = await Promise.all([
    database.getAll('products'),
    database.getAll('productPrices'),
    database.getAll('orders'),
    database.getAll('expenses'),
  ])
  return { products, productPrices, orders, expenses }
}

export async function exportBusinessData(): Promise<BusinessData & { schemaVersion: number; exportedAt: string }> {
  return { ...(await loadBusinessData()), schemaVersion: DATABASE_VERSION, exportedAt: new Date().toISOString() }
}

export async function saveOrder(order: CustomerOrder): Promise<void> {
  const database = await getDatabase()
  await seedIfNeeded(database)
  const prices = await database.getAll('productPrices')
  const transaction = database.transaction(['orders', 'productPrices'], 'readwrite')
  await transaction.objectStore('orders').put(order)

  for (const line of order.lines) {
    const latest = prices
      .filter((price) => price.productId === line.productId)
      .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))[0]
    if (!latest || latest.priceCents !== line.unitPriceCents) {
      await transaction.objectStore('productPrices').put({
        id: `price-${crypto.randomUUID()}`,
        productId: line.productId,
        priceCents: line.unitPriceCents,
        effectiveAt: order.orderedAt,
        timestampSource: 'provided',
      })
    }
  }

  await transaction.done
}
