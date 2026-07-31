/**
 * Formats raw channel URLs into direct chat links based on user context.
 * 
 * @param url The raw saved URL (e.g. LINE Manager URL or Meta Business Suite Inbox URL)
 * @param channel 'facebook' | 'line'
 * @param isCustomerFacing 
 *    - If TRUE (Customer Check Queue page `/check-queue`):
 *      - Facebook: Converts saved URL by extracting `asset_id` into `https://www.facebook.com/messages/t/{asset_id}`.
 *      - LINE: Always opens `https://line.me/R/oaMessage/%40supersix`.
 *    - If FALSE (Admin Queue Table `/queue`):
 *      - Facebook: Opens FULL saved URL as entered (e.g. `https://business.facebook.com/latest/inbox/...`).
 *      - LINE: Opens FULL saved URL as entered (e.g. `https://chat.line.biz/...`).
 */
export function getFormattedChatUrl(
  url?: string | null,
  channel?: string | null,
  isCustomerFacing: boolean = false
): string {
  const normChannel = channel?.toLowerCase() || '';

  // 1. Customer Check Queue page (/check-queue)
  if (isCustomerFacing) {
    if (normChannel === 'line') {
      return 'https://line.me/R/oaMessage/%40supersix';
    }

    if (normChannel === 'facebook' || (url && url.includes('facebook.com'))) {
      if (url) {
        const match = url.match(/[?&]asset_id=([^&]+)/i);
        if (match && match[1]) {
          return `https://www.facebook.com/messages/t/${match[1]}`;
        }
        return url.trim();
      }
      return 'https://www.facebook.com/messages/t/';
    }
  }

  // 2. Admin Queue Table page (/queue): Open exact full saved URL as entered
  if (url && url.trim()) {
    return url.trim();
  }

  // Fallbacks if no URL was saved on Admin side
  if (normChannel === 'line') {
    return 'https://chat.line.biz/';
  }
  if (normChannel === 'facebook') {
    return 'https://business.facebook.com/latest/inbox/';
  }

  return '#';
}
