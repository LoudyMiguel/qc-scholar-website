// Shared by the browser and the Pages Functions, so both trim visitor text the
// same way before checking or storing it.
export function normalizeText(value, maxLength) {
  return String(value || '')
    // Control characters are the point of this expression, not an accident:
    // visitor-supplied names and comments are stripped of them before they
    // reach the database.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}
