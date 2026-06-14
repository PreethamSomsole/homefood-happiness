'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { exportBusinessData, loadBusinessData, saveOrder } from '../lib/database'
import type { BusinessData, CustomerOrder, OrderStatus, PaymentMethod } from '../lib/types'

const EMPTY: BusinessData = { products: [], productPrices: [], orders: [], expenses: [] }
const navItems = ['Dashboard', 'Orders', 'Products', 'Expenses', 'Price history']

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
const timestamp = (value: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
}).format(new Date(value))
const orderTotal = (order: CustomerOrder) => order.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0)
const inputTimestamp = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
const nextFriday = () => {
  const date = new Date()
  const days = (5 - date.getDay() + 7) % 7
  date.setDate(date.getDate() + days)
  date.setHours(17, 0, 0, 0)
  return inputTimestamp(date)
}

export default function Home() {
  const [data, setData] = useState<BusinessData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)

  const refresh = async () => {
    try {
      setData(await loadBusinessData())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The local database could not be opened.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    loadBusinessData()
      .then((businessData) => {
        if (!cancelled) {
          setData(businessData)
          setError('')
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'The local database could not be opened.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const summary = useMemo(() => {
    const revenue = data.orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + orderTotal(order), 0)
    const outstanding = data.orders.filter((order) => order.status !== 'paid').reduce((sum, order) => sum + orderTotal(order), 0)
    const expenses = data.expenses.reduce((sum, expense) => sum + expense.amountCents, 0)
    return { revenue, outstanding, expenses, net: revenue - expenses }
  }, [data])

  const productMap = useMemo(() => new Map(data.products.map((product) => [product.id, product.name])), [data.products])
  const latestOrders = [...data.orders].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
  const prices = [...data.productPrices].sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))

  const handleExport = async () => {
    const blob = new Blob([JSON.stringify(await exportBusinessData(), null, 2)], { type: 'application/json' })
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `homefood-happiness-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }

  return (
    <main className="app-shell min-h-screen text-primary">
      <aside className="side-nav">
        <div className="brand-lockup"><div className="brand-mark">HH</div><div><p className="brand-kicker">Homefood</p><h1>Happiness</h1></div></div>
        <nav className="side-nav-list" aria-label="Primary">
          {navItems.map((item, index) => <a className="nav-link" aria-current={index === 0 ? 'page' : undefined} href={`#${item.toLowerCase().replace(' ', '-')}`} key={item}><Icon index={index} /><span>{item}</span></a>)}
        </nav>
        <div className="side-note"><span className="status-dot" /><span>IndexedDB · this device</span></div>
      </aside>

      <div className="content-shell">
        <header className="top-bar">
          <div><div className="mobile-brandline"><span className="mobile-brand-mark">HH</span><span>Homefood Happiness</span></div><p className="section-kicker">Business dashboard</p><h2>Orders and cashflow</h2></div>
          <div className="top-actions"><button className="button-secondary" onClick={() => void handleExport()}>Export data</button><button className="button-primary" onClick={() => setShowOrderForm((open) => !open)}>+ New order</button></div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {loading ? <div className="panel loading-panel">Opening local database…</div> : (
          <section id="dashboard" className="dashboard-grid">
            <section className="overview-band">
              <div className="overview-copy"><p className="section-kicker">Current records</p><h3>{data.orders.length} orders across {data.products.length} products.</h3><p>Spreadsheet history is stored locally with price snapshots, event timestamps, payment status, and explicit markers for estimated dates.</p></div>
              <div className="quick-action-strip"><button className="quick-action" onClick={() => setShowOrderForm(true)}>+ Record order</button><button className="quick-action" onClick={() => void handleExport()}>Download backup</button></div>
            </section>

            {showOrderForm && <NewOrderForm data={data} onCancel={() => setShowOrderForm(false)} onSaved={async () => { setShowOrderForm(false); await refresh() }} />}

            <section className="metric-grid">
              <Metric label="Paid sales" value={money(summary.revenue)} sub={`${data.orders.filter((order) => order.status === 'paid').length} paid orders`} tone="green" />
              <Metric label="Outstanding" value={money(summary.outstanding)} sub="Pickup or payment pending" tone="gold" />
              <Metric label="Expenses" value={money(summary.expenses)} sub={`${data.expenses.length} recorded purchases`} tone="coral" />
              <Metric label="Cash result" value={money(summary.net)} sub="Paid sales less recorded expenses" tone="blue" />
            </section>

            <section id="orders" className="panel panel-wide">
              <PanelTitle eyebrow="Orders" title="Customer order timeline" badge={`${data.orders.length} orders`} />
              <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Items</th><th>Ordered</th><th>Prepared</th><th>Fulfilled</th><th>Payment</th><th>Total</th></tr></thead><tbody>
                {latestOrders.map((order) => <tr key={order.id}><td><strong>{order.customerName}</strong><span className={`status-chip status-${order.status}`}>{order.status.replaceAll('_', ' ')}</span></td><td>{order.lines.map((line) => `${line.quantity}× ${productMap.get(line.productId)}`).join(', ')}</td><td>{timestamp(order.orderedAt)}<Source source={order.orderedAtSource} /></td><td>{timestamp(order.preparedAt)}<Source source={order.preparedAtSource} /></td><td>{order.fulfilledAt ? timestamp(order.fulfilledAt) : 'Pending'}{order.fulfilledAtSource && <Source source={order.fulfilledAtSource} />}</td><td>{order.paymentMethod === 'unknown' ? 'Not recorded' : order.paymentMethod}<small>{order.paidAt ? timestamp(order.paidAt) : 'Unpaid'}</small></td><td className="money-cell">{money(orderTotal(order))}</td></tr>)}
              </tbody></table></div>
            </section>

            <section id="products" className="panel">
              <PanelTitle eyebrow="Products" title="Current prices" badge={`${data.products.length} active`} />
              <div className="compact-list">{data.products.map((product) => { const price = prices.find((row) => row.productId === product.id); return <div className="compact-row" key={product.id}><div><strong>{product.name}</strong><span>{price ? `Effective ${timestamp(price.effectiveAt)}` : 'No price'}</span></div><b>{price ? money(price.priceCents) : '—'}</b></div> })}</div>
            </section>

            <section id="expenses" className="panel">
              <PanelTitle eyebrow="Expenses" title="Recent purchases" badge={money(summary.expenses)} />
              <div className="compact-list">{[...data.expenses].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 6).map((expense) => <div className="compact-row" key={expense.id}><div><strong>{expense.item}</strong><span>{timestamp(expense.occurredAt)} · {expense.paidBy} · {expense.paymentMethod}</span></div><b>{money(expense.amountCents)}</b></div>)}</div>
            </section>

            <section id="price-history" className="panel panel-wide">
              <PanelTitle eyebrow="Audit trail" title="Product price history" badge={`${prices.length} changes`} />
              <div className="price-grid">{prices.map((price) => <div className="price-event" key={price.id}><strong>{productMap.get(price.productId)}</strong><b>{money(price.priceCents)}</b><span>{timestamp(price.effectiveAt)}</span><Source source={price.timestampSource} /></div>)}</div>
            </section>
          </section>
        )}
      </div>
      <nav className="mobile-nav" aria-label="Mobile primary">{navItems.map((item, index) => <a href={`#${item.toLowerCase().replace(' ', '-')}`} aria-current={index === 0 ? 'page' : undefined} key={item}><Icon index={index} /><span>{item}</span></a>)}</nav>
    </main>
  )
}

function NewOrderForm({ data, onCancel, onSaved }: { data: BusinessData; onCancel: () => void; onSaved: () => Promise<void> }) {
  const latestPrice = (productId: string) => [...data.productPrices].filter((price) => price.productId === productId).sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))[0]?.priceCents ?? 0
  const [customer, setCustomer] = useState('')
  const [productId, setProductId] = useState(data.products[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(() => latestPrice(data.products[0]?.id ?? '') / 100)
  const [orderedAt, setOrderedAt] = useState(inputTimestamp())
  const [preparedAt, setPreparedAt] = useState(nextFriday())
  const [fulfilledAt, setFulfilledAt] = useState(nextFriday())
  const [paidAt, setPaidAt] = useState(inputTimestamp())
  const [status, setStatus] = useState<OrderStatus>('payment_pending')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('zelle')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    const paid = status === 'paid'
    const fulfilled = status !== 'pickup_pending'
    const order: CustomerOrder = { id: crypto.randomUUID(), customerName: customer.trim(), orderedAt: new Date(orderedAt).toISOString(), orderedAtSource: 'provided', preparedAt: new Date(preparedAt).toISOString(), preparedAtSource: 'provided', fulfilledAt: fulfilled ? new Date(fulfilledAt).toISOString() : undefined, fulfilledAtSource: fulfilled ? 'provided' : undefined, paidAt: paid ? new Date(paidAt).toISOString() : undefined, paidAtSource: paid ? 'provided' : undefined, paymentMethod: paid ? paymentMethod : 'unknown', status, lines: [{ id: crypto.randomUUID(), productId, quantity, unitPriceCents: Math.round(price * 100) }] }
    await saveOrder(order); await onSaved(); setSaving(false)
  }

  return <form className="panel panel-wide order-form" onSubmit={(event) => void submit(event)}><PanelTitle eyebrow="New record" title="Add customer order" badge="Saved to this device" /><div className="form-grid"><label>Customer<input required value={customer} onChange={(e) => setCustomer(e.target.value)} /></label><label>Product<select value={productId} onChange={(e) => { setProductId(e.target.value); setPrice(latestPrice(e.target.value) / 100) }}>{data.products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label><label>Quantity<input required min="0.01" step="0.01" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label><label>Unit price<input required min="0" step="0.01" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></label><label>Ordered at<input required type="datetime-local" value={orderedAt} onChange={(e) => setOrderedAt(e.target.value)} /></label><label>Preparation complete<input required type="datetime-local" value={preparedAt} onChange={(e) => setPreparedAt(e.target.value)} /></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}><option value="payment_pending">Payment pending</option><option value="pickup_pending">Pickup pending</option><option value="paid">Paid</option></select></label><label>Fulfilled at<input required={status !== 'pickup_pending'} disabled={status === 'pickup_pending'} type="datetime-local" value={fulfilledAt} onChange={(e) => setFulfilledAt(e.target.value)} /></label><label>Payment method<select disabled={status !== 'paid'} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}><option value="cash">Cash</option><option value="card">Card</option><option value="zelle">Zelle</option></select></label><label>Paid at<input required={status === 'paid'} disabled={status !== 'paid'} type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></label></div><div className="form-actions"><button type="button" className="button-secondary" onClick={onCancel}>Cancel</button><button className="button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save order'}</button></div></form>
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) { return <article className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{sub}</span></article> }
function PanelTitle({ eyebrow, title, badge }: { eyebrow: string; title: string; badge: string }) { return <div className="panel-header"><div><p className="section-kicker">{eyebrow}</p><h3>{title}</h3></div><span className="panel-badge">{badge}</span></div> }
function Source({ source }: { source: string }) { return <small className={source === 'provided' ? 'source-provided' : 'source-estimated'}>{source === 'provided' ? 'Exact' : 'Estimated'}</small> }
function Icon({ index }: { index: number }) { const paths = ['M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z', 'M5 7h14v12H5zM8 3v4M16 3v4M8 11h8', 'M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8', 'M4 7h16v12H4zM4 11h16M8 15h3', 'M5 19V5M5 19h14M8 15l3-4 3 2 4-6']; return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={paths[index]} /></svg> }
