import type { Format } from '../shared/schemas.js';
const scalar = (x: unknown): string => typeof x === 'string' ? x : x == null ? '' : JSON.stringify(x);
const safeCsv = (x: unknown): string => {
  let value = scalar(x); if (/^[\s\u0000-\u001f]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value)) value = "'" + value;
  return `"${value.replaceAll('"', '""')}"`;
};
const safeMd = (x: unknown) => scalar(x).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\\`*_{}\[\]()#+.!|~-]/g, '\\$&').replaceAll('\n', '<br>');
export function renderExport(rows: unknown[], format: Format): string {
  if (format === 'json') return JSON.stringify(rows, null, 2) + '\n';
  const records = rows as Record<string, unknown>[];
  const columns = [...new Set(records.flatMap(Object.keys))];
  if (format === 'csv') return '\uFEFF' + [columns.map(safeCsv).join(','), ...records.map(row => columns.map(c => safeCsv(row[c])).join(','))].join('\r\n') + '\r\n';
  return '| ' + columns.map(safeMd).join(' | ') + ' |\n| ' + columns.map(() => '---').join(' | ') + ' |\n' + records.map(row => '| ' + columns.map(c => safeMd(row[c])).join(' | ') + ' |').join('\n') + '\n';
}
