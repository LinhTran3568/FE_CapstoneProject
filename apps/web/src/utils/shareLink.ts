/**
 * Link a seller shares for a PRIVATE listing: `<current site>/p/<shareToken>`.
 *
 * Why we do not copy `shareUrl` from the API:
 * the backend hard-codes the production domain (https://ticketshield.vn/p/{token}),
 * which is not live yet, so a link copied on localhost or staging would open nothing.
 * Building the link from the site the seller is using works on every environment.
 *
 * The buyer-side page for `/p/:shareToken` is SCRUM-24; it calls
 * GET /api/v1/resale-listings/private/{shareToken}.
 */
export const buildPrivateShareLink = (
  shareToken: string,
  origin: string = window.location.origin
): string => `${origin}/p/${encodeURIComponent(shareToken)}`;

/**
 * Link to a PUBLIC listing on the Marketplace.
 */
export const buildPublicShareLink = (
  listingId: string,
  origin: string = window.location.origin
): string => `${origin}/marketplace?listingId=${encodeURIComponent(listingId)}`;

/** Copy text to the clipboard, falling back to a hidden textarea on older browsers. */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard is not available');
};
