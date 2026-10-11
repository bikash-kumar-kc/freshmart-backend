// common/utils/timestamp.utils.ts
// SQLite's current_timestamp gives "YYYY-MM-DD HH:MM:SS" (UTC, no zone), which browsers parse as LOCAL time
const SQLITE_UTC = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export const toIsoUtc = (ts: string) =>
  SQLITE_UTC.test(ts) ? `${ts.replace(' ', 'T')}Z` : ts;
