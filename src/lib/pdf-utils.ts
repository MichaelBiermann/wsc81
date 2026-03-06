/**
 * Shared PDF utility functions — also used by the admin events PDF route.
 */

export function stripHtml(html: string): string {
  return html
    .replace(/<span[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(li|tr|td|th|h[1-6]|div|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

export function calcAge(dob: Date | null): string {
  if (!dob) return "-";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return String(age);
}
