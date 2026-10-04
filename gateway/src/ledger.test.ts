import { DatabaseSync } from 'node:sqlite'
import { describe, expect, test, vi } from 'vitest'
import {
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  MAX_STEPS,
  RESERVATION_TTL_MS,
  SpendBook,
  stepWorstCaseUsd,
  TITLE_WORST_CASE_USD,
  worstCaseUsd,
} from './ledger.ts'
import { PEAK_USD_PER_MTOK, usageCost } from './policy.ts'

vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    ctx: unknown
    env: unknown
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx
      this.env = env
    }
  },
}))

const { SpendLedger } = await import('./spend-ledger.ts')

const DAY = '2026-10-05'

/** The DO's SQLite storage, on node:sqlite. */
function fakeState(db = new DatabaseSync(':memory:')) {
  const sql = {
    exec(query: string, ...bindings: (string | number)[]) {
      const rows = db.prepare(query).all(...bindings)
      return { toArray: () => rows }
    },
  }
  return { storage: { sql, transactionSync: <T>(fn: () => T) => fn() } } as unknown as DurableObjectState
}

/** Lets other callers run between awaits, as concurrent isolates calling one DO would. */
const jitter = (i: number) =>
  new Promise<void>((resolve) => (i % 3 === 0 ? queueMicrotask(resolve) : setTimeout(resolve, i % 7)))

describe('worstCaseUsd', () => {
  test('grows with the body size', () => {
    const sizes = [0, 1024, 15_000, 65_536, MAX_BODY_BYTES]
    const costs = sizes.map((bodyBytes) => worstCaseUsd({ bodyBytes }))
    for (let i = 1; i < costs.length; i++) expect(costs[i]!).toBeGreaterThan(costs[i - 1]!)
  })

  test('grows with every step the bounds allow and includes the title call', () => {
    for (let step = 1; step < MAX_STEPS; step++)
      expect(stepWorstCaseUsd(15_000, step)).toBeGreaterThan(stepWorstCaseUsd(15_000, step - 1))
    let sum = TITLE_WORST_CASE_USD
    for (let step = 0; step < MAX_STEPS; step++) sum += stepWorstCaseUsd(15_000, step)
    expect(worstCaseUsd({ bodyBytes: 15_000 })).toBeCloseTo(sum, 12)
    // Every step can emit its full output at the peak output rate.
    expect(worstCaseUsd({ bodyBytes: 0 })).toBeGreaterThan(
      (MAX_STEPS * MAX_OUTPUT_TOKENS * PEAK_USD_PER_MTOK.output) / 1e6,
    )
  })

  test('a typical 15 KB request reserves about six cents, so about 30 turns fit in flight under $2', () => {
    const usd = worstCaseUsd({ bodyBytes: 15_000 })
    expect(usd).toBeGreaterThan(0.05)
    expect(usd).toBeLessThan(0.08)
    expect(Math.floor(2 / usd)).toBeGreaterThanOrEqual(25)
  })

  test("is never below the measured cost of the spike's logged turns, even repriced at peak with no cache hits", () => {
    // gateway.log of the frozen spike, 2026-10-04: every `usage` line (title call included).
    const turns = [
      { input: 7379, cached: 1408, output: 902, costUsd: 0.001441 },
      { input: 8086, cached: 2944, output: 377, costUsd: 0.001006 },
      { input: 7349, cached: 5632, output: 206, costUsd: 0.000398 },
      { input: 8842, cached: 3072, output: 182, costUsd: 0.000984 },
      { input: 8086, cached: 7680, output: 293, costUsd: 0.00026 },
      { input: 7423, cached: 2688, output: 340, costUsd: 0.000922 },
      { input: 5790, cached: 2816, output: 156, costUsd: 0.000548 },
      { input: 8898, cached: 5632, output: 212, costUsd: 0.000634 },
      { input: 8086, cached: 5632, output: 283, costUsd: 0.000555 },
    ]
    const peak = new Date('2026-10-05T02:00:00Z')
    // The worst case grows with the body, so the empty body is its floor.
    const floor = worstCaseUsd({ bodyBytes: 0 })
    for (const turn of turns) {
      const repriced = usageCost({ inputTokens: turn.input, outputTokens: turn.output, cachedInputTokens: 0 }, peak)
      expect(floor).toBeGreaterThan(repriced.usd)
      expect(floor).toBeGreaterThan(turn.costUsd)
    }
  })
})

describe('SpendBook', () => {
  test('serial reservations stop at the cap', () => {
    const book = new SpendBook()
    const ids = Array.from({ length: 6 }, () => book.reserve(DAY, 0.5, 2, 0))
    expect(ids.filter(Boolean)).toHaveLength(4)
    expect(ids.slice(4)).toEqual([null, null])
    expect(book.total(DAY)).toBe(2)
    // Another day has its own budget.
    expect(book.reserve('2026-10-06', 0.5, 2, 0)).not.toBeNull()
  })

  test('a cap of zero, a cap that is not a number and an amount that is not a number refuse', () => {
    const book = new SpendBook()
    expect(book.reserve(DAY, 0.01, 0, 0)).toBeNull()
    expect(book.reserve(DAY, 0.01, Number.NaN, 0)).toBeNull()
    expect(book.reserve(DAY, Number.NaN, 2, 0)).toBeNull()
    expect(book.reserve('not-a-day', 0.01, 2, 0)).toBeNull()
  })

  test('200 concurrent reservations at a $2 cap accept a set whose total is at most $2', async () => {
    const book = new SpendBook()
    const usd = worstCaseUsd({ bodyBytes: 15_000 })
    const outcomes = await Promise.allSettled(
      Array.from({ length: 200 }, async (_, i) => {
        await jitter(i)
        return book.reserve(DAY, usd, 2, 0)
      }),
    )
    const accepted = outcomes.filter((o) => o.status === 'fulfilled' && o.value !== null)
    expect(outcomes.every((o) => o.status === 'fulfilled')).toBe(true)
    expect(accepted.length * usd).toBeLessThanOrEqual(2)
    expect(accepted).toHaveLength(Math.floor(2 / usd))
    expect(book.total(DAY)).toBeLessThanOrEqual(2)
  })

  test('settling below the reservation frees the difference', () => {
    const book = new SpendBook()
    const id = book.reserve(DAY, 0.5, 1, 0)!
    expect(book.reserve(DAY, 0.6, 1, 0)).toBeNull()
    book.settle(id, 0.1)
    expect(book.total(DAY)).toBeCloseTo(0.1, 9)
    expect(book.reserve(DAY, 0.6, 1, 0)).not.toBeNull()
    expect(book.total(DAY)).toBeCloseTo(0.7, 9)
  })

  test('an expired reservation is charged in full: the day stays spent, it is no longer open', () => {
    const lines: string[] = []
    const book = new SpendBook(undefined, (line) => lines.push(line))
    const id = book.reserve(DAY, 1.5, 2, 0)!
    expect(book.reserve(DAY, 0.5, 2, RESERVATION_TTL_MS - 1)).not.toBeNull()
    expect(lines.some((l) => l.startsWith('spend-expired'))).toBe(false)
    // At the TTL the 1.50 becomes spend instead of being released, so the day stays full.
    expect(book.reserve(DAY, 0.01, 2, RESERVATION_TTL_MS)).toBeNull()
    expect(lines).toContain(`spend-expired id=${id} day=${DAY} reservedUsd=1.500000 chargedUsd=1.500000`)
    expect(book.total(DAY)).toBe(2)
    // The charge counts toward the day's alerts like any other spend.
    expect(lines.filter((l) => l.startsWith('spend-alert'))).toEqual([
      `spend-alert day=${DAY} level=50 reason=spent spentUsd=1.500000 capUsd=2.000000`,
      expect.stringMatching(new RegExp(`^spend-alert day=${DAY} level=100 reason=refused `)),
    ])
  })

  test('a settle that arrives after expiry adds only its excess over the reservation, never the charge twice', () => {
    const lines: string[] = []
    const book = new SpendBook(undefined, (line) => lines.push(line))
    const under = book.reserve(DAY, 0.5, 2, 0)!
    const over = book.reserve(DAY, 0.25, 2, 0)!
    const nan = book.reserve(DAY, 0.25, 2, 0)!
    book.reserve(DAY, 0.01, 2, RESERVATION_TTL_MS)
    expect(book.total(DAY)).toBeCloseTo(1.01, 9)

    book.settle(under, 0.002)
    expect(book.total(DAY)).toBeCloseTo(1.01, 9)
    expect(lines).toContain(
      `spend-settle-late id=${under} day=${DAY} reservedUsd=0.500000 measuredUsd=0.002000 addedUsd=0.000000`,
    )

    book.settle(over, 0.4)
    expect(book.total(DAY)).toBeCloseTo(1.16, 9)
    expect(lines).toContain(
      `spend-settle-late id=${over} day=${DAY} reservedUsd=0.250000 measuredUsd=0.400000 addedUsd=0.150000`,
    )

    book.settle(nan, Number.NaN)
    expect(book.total(DAY)).toBeCloseTo(1.16, 9)
  })

  test('a settle above the reservation is recorded in full and logged', () => {
    const lines: string[] = []
    const book = new SpendBook(undefined, (line) => lines.push(line))
    const id = book.reserve(DAY, 0.01, 2, 0)!
    book.settle(id, 0.05)
    expect(book.total(DAY)).toBeCloseTo(0.05, 9)
    expect(lines).toContain(`spend-overrun id=${id} day=${DAY} reservedUsd=0.010000 measuredUsd=0.050000`)
  })

  test('a settle whose cost is not a number charges what was reserved', () => {
    const book = new SpendBook()
    const id = book.reserve(DAY, 0.25, 2, 0)!
    book.settle(id, Number.NaN)
    expect(book.total(DAY)).toBe(0.25)
  })

  test('spend-alert marks the first crossing of 50% and 100% of the cap each day', () => {
    const lines: string[] = []
    const book = new SpendBook(undefined, (line) => lines.push(line))
    const alerts = () => lines.filter((l) => l.startsWith('spend-alert'))
    book.settle(book.reserve(DAY, 0.5, 2, 0)!, 0.4)
    expect(alerts()).toEqual([])
    book.settle(book.reserve(DAY, 0.7, 2, 0)!, 0.6)
    expect(alerts()).toEqual([`spend-alert day=${DAY} level=50 reason=spent spentUsd=1.000000 capUsd=2.000000`])
    book.settle(book.reserve(DAY, 0.5, 2, 0)!, 0.5)
    expect(alerts()).toHaveLength(1)
    expect(book.reserve(DAY, 0.6, 2, 0)).toBeNull()
    expect(book.reserve(DAY, 0.6, 2, 0)).toBeNull()
    expect(alerts()).toHaveLength(2)
    expect(alerts()[1]).toMatch(new RegExp(`^spend-alert day=${DAY} level=100 reason=refused `))
  })
})

describe('SpendLedger (the Durable Object, on SQLite)', () => {
  test('200 concurrent reserve calls at a $2 cap accept a set whose total is at most $2', async () => {
    const ledger = new SpendLedger(fakeState(), {})
    const usd = worstCaseUsd({ bodyBytes: 15_000 })
    const outcomes = await Promise.allSettled(
      Array.from({ length: 200 }, async (_, i) => {
        await jitter(i)
        return ledger.reserve(DAY, usd, 2)
      }),
    )
    const accepted = outcomes.flatMap((o) => (o.status === 'fulfilled' && o.value ? [o.value] : []))
    expect(outcomes.every((o) => o.status === 'fulfilled')).toBe(true)
    expect(accepted.length * usd).toBeLessThanOrEqual(2)
    expect(accepted).toHaveLength(Math.floor(2 / usd))
    expect(await ledger.total(DAY)).toBeLessThanOrEqual(2)

    // Concurrent settles at the measured cost free the rest of the day.
    await Promise.allSettled(accepted.map(async (id, i) => (await jitter(i), ledger.settle(id, 0.001))))
    expect(await ledger.total(DAY)).toBeCloseTo(accepted.length * 0.001, 9)
  })

  test('the day and its open reservations survive a restart of the object', async () => {
    const db = new DatabaseSync(':memory:')
    const first = new SpendLedger(fakeState(db), {})
    const id = (await first.reserve(DAY, 0.5, 2))!
    const settledId = (await first.reserve(DAY, 0.5, 2))!
    await first.settle(settledId, 0.25)

    const second = new SpendLedger(fakeState(db), {})
    expect(await second.total(DAY)).toBeCloseTo(0.75, 9)
    expect(await second.reserve(DAY, 1.3, 2)).toBeNull()
    await second.settle(id, 0.1)
    expect(await second.total(DAY)).toBeCloseTo(0.35, 9)
  })

  test('a settle above the reservation is recorded and logged by the object', async () => {
    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((line: string) => void lines.push(line))
    try {
      const ledger = new SpendLedger(fakeState(), {})
      const id = (await ledger.reserve(DAY, 0.01, 2))!
      await ledger.settle(id, 0.03)
      expect(await ledger.total(DAY)).toBeCloseTo(0.03, 9)
      expect(lines).toContain(`spend-overrun id=${id} day=${DAY} reservedUsd=0.010000 measuredUsd=0.030000`)
    } finally {
      spy.mockRestore()
    }
  })
})
