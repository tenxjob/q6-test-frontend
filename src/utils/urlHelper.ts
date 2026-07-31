/**
 * Helper to detect if the current device is a Mobile phone or Tablet / iPad.
 */
export function isMobileOrTabletDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';
  const isMobileOrTabletUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet/i.test(ua);
  const isIPadOS = /Macintosh/i.test(ua) && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  return isMobileOrTabletUA || isIPadOS;
}

/**
 * Helper to detect if the page is being opened inside Facebook or Messenger In-App Browser.
 */
export function isInFBInAppBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';
  return Boolean(ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB') || ua.includes('Messenger'));
}

/**
 * Formats raw channel URLs into direct chat links based on user context, device, and browser type.
 * 
 * @param url The raw saved URL (e.g. LINE Manager URL or Meta Business Suite Inbox URL)
 * @param channel 'facebook' | 'line'
 * @param isCustomerFacing 
 *    - If TRUE (Customer Check Queue page `/check-queue`):
 *      - Facebook: 
 *          - Inside Messenger/FB App: `https://m.me/{targetId}` (prevents white screen deep link loop)
 *          - Mobile / iPad (External Browser): `fb-messenger://user-thread/{targetId}` (default `283146365675503`)
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
        const mMeMatch = url.match(/m\.me\/([^/?#&]+)/i);
        if (assetMatch && assetMatch[1]) {
          targetId = assetMatch[1];
        } else if (threadMatch && threadMatch[1]) {
          targetId = threadMatch[1];
        } else if (mMeMatch && mMeMatch[1]) {
          targetId = mMeMatch[1];
        }
      }

      // 1. If inside Facebook / Messenger In-App Browser: Use https://m.me/ to prevent deep link infinite loop
      if (isInFBInAppBrowser()) {
        return `https://m.me/${targetId}`;
      }

      // 2. If Mobile or iPad (External Browser Safari/Chrome/LINE): Use deep link fb-messenger://
      if (isMobileOrTabletDevice()) {
        return `fb-messenger://user-thread/${targetId}`;
      }

      // 3. Desktop Browser: Use https://www.facebook.com/messages/t/
      return `https://www.facebook.com/messages/t/${targetId}`;
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
