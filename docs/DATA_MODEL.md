# Data Model

## Principles

- Use TypeScript types or interfaces, not Prisma models, in static v1.
- Use UUID strings for IDs.
- Store money in integer cents.
- Store weight in grams.
- Store count quantities as decimal numbers.
- Store timestamps as ISO 8601 strings.
- Keep records versionable so future migrations can transform local data.

## Core Types

```ts
export interface RawMaterial {
  id: string
  name: string
  defaultUnit: 'gram' | 'kilogram' | 'ounce' | 'pound' | 'count'
  reorderLevel?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RawMaterialInventoryAdjustment {
  id: string
  rawMaterialId: string
  quantityGrams?: number
  quantityCount?: number
  reason: 'opening_balance' | 'waste' | 'correction' | 'personal_use'
  note?: string
  occurredAt: string
}

export interface Purchase {
  id: string
  vendorName?: string
  purchasedAt: string
  totalCents: number
  notes?: string
  lineItems: PurchaseLineItem[]
}

export interface PurchaseLineItem {
  id: string
  purchaseId: string
  rawMaterialId: string
  quantityGrams?: number
  quantityCount?: number
  totalCents: number
}

export interface Expense {
  id: string
  category: string
  description: string
  amountCents: number
  occurredAt: string
  notes?: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  active: boolean
  recipeItems: ProductRecipeItem[]
  priceHistory: ProductPriceHistory[]
  createdAt: string
  updatedAt: string
}

export interface ProductRecipeItem {
  id: string
  productId: string
  rawMaterialId: string
  quantityGrams?: number
  quantityCount?: number
}

export interface ProductPriceHistory {
  id: string
  productId: string
  priceCents: number
  effectiveAt: string
}

export interface ProductionBatch {
  id: string
  productId: string
  quantityProduced: number
  producedAt: string
  notes?: string
}

export interface FinishedProductInventory {
  id: string
  productId: string
  quantityOnHand: number
  updatedAt: string
}

export interface Sale {
  id: string
  customerName?: string
  soldAt: string
  totalCents: number
  lineItems: SaleLineItem[]
  notes?: string
}

export interface SaleLineItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export interface BusinessSettings {
  id: 'business-settings'
  businessName: string
  currency: string
  defaultTaxRateBasisPoints?: number
  updatedAt: string
}

export interface UserLocalAuthSettings {
  id: 'local-auth'
  passwordHash: string
  salt: string
  algorithm: 'PBKDF2'
  iterations: number
  version: number
  createdAt: string
  updatedAt: string
}
```

## Backup Envelope

```ts
export interface AppBackup {
  appName: 'homefood-happiness'
  schemaVersion: number
  exportedAt: string
  data: {
    rawMaterials: RawMaterial[]
    rawMaterialInventoryAdjustments: RawMaterialInventoryAdjustment[]
    purchases: Purchase[]
    expenses: Expense[]
    products: Product[]
    productionBatches: ProductionBatch[]
    finishedProductInventory: FinishedProductInventory[]
    sales: Sale[]
    businessSettings: BusinessSettings | null
  }
}
```

Auth settings should not be included in normal business data export unless the UI explicitly offers a full local profile backup.

