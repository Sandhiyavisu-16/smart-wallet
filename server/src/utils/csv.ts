import { stringify } from 'csv-stringify/sync';

export function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  return stringify(data, {
    header: true,
    columns,
  });
}
