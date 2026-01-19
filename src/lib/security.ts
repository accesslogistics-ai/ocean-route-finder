/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param unsafe - The potentially unsafe string to escape
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '-';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
