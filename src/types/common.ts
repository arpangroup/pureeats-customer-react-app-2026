// Shared shapes used across every service response, mock or live.
// Unlike the admin panel, customer-facing backend endpoints return plain
// lists (no PageResponse paging) — see services/* for client-side
// search/filter/sort over the fetched array.

export type Id = number

export interface ApiError {
  message: string
  status?: number
  fieldErrors?: Record<string, string>
}
