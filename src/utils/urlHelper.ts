/**
 * Helper to detect if the current device is a Mobile phone or Tablet / iPad.
 */
export function isMobileOrTabletDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileOrTabletUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet/i.test(ua);
  const isIPadOS = /Macintosh/i.test(ua) && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  return isMobileOrTabletUA || isIPadOS;
}

/**
 * Formats raw channel URLs into direct chat links based on user context and device.
 * 
 * @param url The raw saved URL (e.g. LINE Manager URL or Meta Business Suite Inbox URL)
 * @param channel 'facebook' | 'line'
 * @param isCustomerFacing 
 *    - If TRUE (Customer Check Queue page `/check-queue`):
 *      - Facebook: 
 *          - Mobile / iPad: `fb-messenger://user-thread/{targetId}` (default `283146365675503`)
 *          - Desktop: `https://www.facebook.com/messages/t/{targetId}` (default `283146365675503`)
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
      let targetId = '283146365675503';
      if (url) {
        const assetMatch = url.match(/[?&]asset_id=([^&]+)/i);
        const threadMatch = url.match(/(?:messages\/t|user-thread)\/([^/?#&]+)/i);
        if (assetMatch && assetMatch[1]) {
          targetId = assetMatch[1];
        } else if (threadMatch && threadMatch[1]) {
          targetId = threadMatch[1];
        }
      }

      // Check device type
      if (isMobileOrTabletDevice()) {
        return `fb-messenger://user-thread/${targetId}`;
      } else {
        return `https://www.facebook.com/messages/t/${targetId}`;
      }
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
