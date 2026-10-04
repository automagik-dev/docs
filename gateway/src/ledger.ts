// The turn bounds, the worst case a turn can cost under them, and SpendBook, the
// reserve-and-settle accounting behind the hard daily cap. Pure: the SpendLedger
// Durable Object supplies the storage, the clock and the log.
//
// The cap holds under concurrency because a turn reserves its worst case before it
// calls DeepSeek, and reserve() checks and records in one synchronous step inside a
// single Durable Object, which runs one request at a time.

import { PEAK_USD_PER_MTOK } from './policy.ts'

/** Model calls per turn (stopWhen: stepCountIs). */
export const MAX_STEPS = 6
/** maxOutputTokens of every model call. */
export const MAX_OUTPUT_TOKENS = 1024
/** JSON bytes of tool output handed to the model per step, all of the step's tool calls together. */
export const MAX_TOOL_BYTES = 16384
/** Largest request body the gateway reads. */
export const MAX_BODY_BYTES = 262144
/** A reservation never settled (its isolate died) is released after this long. */
export const RESERVATION_TTL_MS = 600000

/** One token per 2 bytes: real text runs about 4 bytes a token. */
export const BYTES_PER_TOKEN = 2
/** Per model call: the bash tool definition, the chat template and message framing. */
export const STEP_OVERHEAD_TOKENS = 2048
/** The title call: its fixed instruction plus the question cut to TITLE_QUESTION_CHARS. */
export const TITLE_QUESTION_CHARS = 2000
export const TITLE_MAX_OUTPUT_TOKENS = 60
/** 2000 UTF-16 units are at most 6000 UTF-8 bytes; the instruction adds about 150. */
const TITLE_PROMPT_BYTES = 8192

const tokensOf = (bytes: number) => Math.ceil(bytes / BYTES_PER_TOKEN)
/** Peak rates, every input token a cache miss. */
const peakMissUsd = (inputTokens: number, outputTokens: number) =>
  (inputTokens * PEAK_USD_PER_MTOK.cacheMiss + outputTokens * PEAK_USD_PER_MTOK.output) / 1e6

/**
 * Worst case of model call `step` (0-based) of a turn whose body is `bodyBytes`.
 * The input is the body, the per-call overhead, and what every earlier step added:
 * its output, the framing of its tool results (each tool call is paid for in output
 * tokens, so that framing is bounded by the same count), and its tool output.
 */
export function stepWorstCaseUsd(bodyBytes: number, step: number): number {
  const carried = step * (2 * MAX_OUTPUT_TOKENS + tokensOf(MAX_TOOL_BYTES))
  return peakMissUsd(tokensOf(bodyBytes) + STEP_OVERHEAD_TOKENS + carried, MAX_OUTPUT_TOKENS)
}

export const TITLE_WORST_CASE_USD = peakMissUsd(tokensOf(TITLE_PROMPT_BYTES), TITLE_MAX_OUTPUT_TOKENS)

/** What a turn reserves: every step at its bound, plus the title call. */
export function worstCaseUsd({ bodyBytes }: { bodyBytes: number }): number {
  let total = TITLE_WORST_CASE_USD
  for (let step = 0; step < MAX_STEPS; step++) total += stepWorstCaseUsd(bodyBytes, step)
  return total
}

// ---- SpendBook ----

/** Amounts are kept in whole micro-dollars, so sums are exact and the cap compare cannot drift. */
const nanos = (usd: number) => Math.round(usd * 1e9)
/** Spend and reservations round up. */
export const toMicros = (usd: number) => Math.ceil(nanos(usd) / 1e3)
/** The cap rounds down. */
const capMicrosOf = (cap: number) => (Number.isFinite(cap) && cap > 0 ? Math.floor(nanos(cap) / 1e3) : 0)
const usdText = (micros: number) => (micros / 1e6).toFixed(6)

export type Reservation = { id: string; day: string; micros: number; createdAt: number }
/** `alerted` is the highest spend-alert level already logged that day: 0, 50 or 100. */
export type DayRecord = { spentMicros: number; capMicros: number; alerted: number }

export interface SpendStore {
  day(day: string): DayRecord
  putDay(day: string, record: DayRecord): void
  openReservations(): Reservation[]
  addReservation(reservation: Reservation): void
  removeReservation(id: string): Reservation | undefined
}

export class MemorySpendStore implements SpendStore {
  private readonly days = new Map<string, DayRecord>()
  private readonly open = new Map<string, Reservation>()
  day(day: string): DayRecord {
    return { ...(this.days.get(day) ?? { spentMicros: 0, capMicros: 0, alerted: 0 }) }
  }
  putDay(day: string, record: DayRecord): void {
    this.days.set(day, { ...record })
  }
  openReservations(): Reservation[] {
    return [...this.open.values()]
  }
  addReservation(reservation: Reservation): void {
    this.open.set(reservation.id, { ...reservation })
  }
  removeReservation(id: string): Reservation | undefined {
    const reservation = this.open.get(id)
    this.open.delete(id)
    return reservation
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const ALERT_LEVELS = [50, 100] as const

export class SpendBook {
  constructor(
    private readonly store: SpendStore = new MemorySpendStore(),
    private readonly log: (line: string) => void = () => {},
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  /**
   * Reserves `usd` against `day` when the day's settled spend, its open reservations
   * and this amount together fit under `cap`. Returns the reservation id, or null
   * when it does not fit (or the amount or the cap is not a usable number).
   */
  reserve(day: string, usd: number, cap: number, now: number): string | null {
    this.expire(now)
    const want = toMicros(usd)
    if (!DAY.test(day) || !(want > 0)) {
      this.log(`spend-ledger refused invalid reservation day=${JSON.stringify(day)} usd=${usd}`)
      return null
    }
    const record = this.store.day(day)
    record.capMicros = capMicrosOf(cap)
    const committed = record.spentMicros + this.openMicros(day)
    if (committed + want > record.capMicros) {
      if (record.alerted < 100) {
        record.alerted = 100
        this.log(
          `spend-alert day=${day} level=100 reason=refused committedUsd=${usdText(committed)} requestedUsd=${usdText(want)} capUsd=${usdText(record.capMicros)}`,
        )
      }
      this.store.putDay(day, record)
      return null
    }
    const id = `${day}/${this.newId()}`
    this.store.addReservation({ id, day, micros: want, createdAt: now })
    this.store.putDay(day, record)
    return id
  }

  /**
   * Closes a reservation at the measured cost. The difference from the reserved
   * amount is freed; a cost above it is still recorded in full and logged, and so
   * is a settle that arrives after its reservation expired (the id carries its day).
   */
  settle(id: string, usd: number): void {
    const reservation = this.store.removeReservation(id)
    const day = reservation?.day ?? id.split('/')[0] ?? ''
    if (!DAY.test(day)) {
      this.log(`spend-ledger ignored settle for unknown id=${JSON.stringify(id)}`)
      return
    }
    // A cost that is not a number is a bug upstream: charge what was reserved.
    const measured = Number.isFinite(usd) ? Math.max(0, toMicros(usd)) : (reservation?.micros ?? 0)
    const record = this.store.day(day)
    record.spentMicros += measured
    if (!reservation) {
      this.log(`spend-settle-late id=${id} day=${day} measuredUsd=${usdText(measured)}`)
    } else if (measured > reservation.micros) {
      this.log(
        `spend-overrun id=${id} day=${day} reservedUsd=${usdText(reservation.micros)} measuredUsd=${usdText(measured)}`,
      )
    }
    for (const level of ALERT_LEVELS) {
      if (record.alerted < level && record.capMicros > 0 && record.spentMicros * 100 >= record.capMicros * level) {
        record.alerted = level
        this.log(
          `spend-alert day=${day} level=${level} reason=spent spentUsd=${usdText(record.spentMicros)} capUsd=${usdText(record.capMicros)}`,
        )
      }
    }
    this.store.putDay(day, record)
  }

  /** Settled spend plus open reservations for `day`, in USD: what the cap is checked against. */
  total(day: string): number {
    return (this.store.day(day).spentMicros + this.openMicros(day)) / 1e6
  }

  private openMicros(day: string): number {
    let sum = 0
    for (const reservation of this.store.openReservations()) if (reservation.day === day) sum += reservation.micros
    return sum
  }

  /** Releases reservations older than RESERVATION_TTL_MS: their turns can no longer settle. */
  private expire(now: number): void {
    for (const reservation of this.store.openReservations()) {
      if (now - reservation.createdAt < RESERVATION_TTL_MS) continue
      this.store.removeReservation(reservation.id)
      this.log(`spend-expired id=${reservation.id} day=${reservation.day} reservedUsd=${usdText(reservation.micros)}`)
    }
  }
}
