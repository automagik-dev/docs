// SpendLedger: the one Durable Object (idFromName('spend')) that holds the daily
// spend and the open reservations, in its SQLite storage. All accounting is
// SpendBook's; this class only gives it a store, a clock and the Worker log, and
// runs each call as one synchronous transaction.

import { DurableObject } from 'cloudflare:workers'
import { type DayRecord, type Reservation, SpendBook, type SpendStore } from './ledger.ts'

type Row = Record<string, SqlStorageValue>

export class SqlSpendStore implements SpendStore {
  constructor(private readonly sql: SqlStorage) {
    sql.exec(
      'CREATE TABLE IF NOT EXISTS spend_day (day TEXT PRIMARY KEY, spent_micros INTEGER NOT NULL, cap_micros INTEGER NOT NULL, alerted INTEGER NOT NULL)',
    )
    sql.exec(
      'CREATE TABLE IF NOT EXISTS reservation (id TEXT PRIMARY KEY, day TEXT NOT NULL, micros INTEGER NOT NULL, created_at INTEGER NOT NULL)',
    )
  }

  day(day: string): DayRecord {
    const row = this.sql
      .exec<Row>('SELECT spent_micros, cap_micros, alerted FROM spend_day WHERE day = ?', day)
      .toArray()[0]
    if (!row) return { spentMicros: 0, capMicros: 0, alerted: 0 }
    return { spentMicros: Number(row.spent_micros), capMicros: Number(row.cap_micros), alerted: Number(row.alerted) }
  }

  putDay(day: string, record: DayRecord): void {
    this.sql.exec(
      'INSERT INTO spend_day (day, spent_micros, cap_micros, alerted) VALUES (?, ?, ?, ?) ON CONFLICT(day) DO UPDATE SET spent_micros = excluded.spent_micros, cap_micros = excluded.cap_micros, alerted = excluded.alerted',
      day,
      record.spentMicros,
      record.capMicros,
      record.alerted,
    )
  }

  openReservations(): Reservation[] {
    return this.sql
      .exec<Row>('SELECT id, day, micros, created_at FROM reservation')
      .toArray()
      .map((row) => ({
        id: String(row.id),
        day: String(row.day),
        micros: Number(row.micros),
        createdAt: Number(row.created_at),
      }))
  }

  addReservation(reservation: Reservation): void {
    this.sql.exec(
      'INSERT INTO reservation (id, day, micros, created_at) VALUES (?, ?, ?, ?)',
      reservation.id,
      reservation.day,
      reservation.micros,
      reservation.createdAt,
    )
  }

  removeReservation(id: string): Reservation | undefined {
    const row = this.sql.exec<Row>('SELECT id, day, micros, created_at FROM reservation WHERE id = ?', id).toArray()[0]
    if (!row) return undefined
    this.sql.exec('DELETE FROM reservation WHERE id = ?', id)
    return { id: String(row.id), day: String(row.day), micros: Number(row.micros), createdAt: Number(row.created_at) }
  }
}

export class SpendLedger extends DurableObject<unknown> {
  private readonly book: SpendBook

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env)
    this.book = new SpendBook(new SqlSpendStore(ctx.storage.sql), (line) => console.log(line))
  }

  async reserve(day: string, usd: number, cap: number): Promise<string | null> {
    return this.ctx.storage.transactionSync(() => this.book.reserve(day, usd, cap, Date.now()))
  }

  async settle(id: string, usd: number): Promise<void> {
    this.ctx.storage.transactionSync(() => this.book.settle(id, usd))
  }

  async total(day: string): Promise<number> {
    return this.book.total(day)
  }
}
