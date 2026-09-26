/**
 * Image storage abstraction.
 *
 * Provides a stable interface that can be backed by:
 * - Local storage (current Phase 2 stub — accepts URLs provided by client)
 * - Cloudinary (Phase 3+)
 * - AWS S3 (Phase 3+)
 *
 * To swap the provider, change the `storageProvider` export below.
 */

export interface ImageStorageProvider {
  /**
   * Validate that an image URL is acceptable (format, domain allowlist, etc.)
   */
  validateImageUrl(url: string): boolean;

  /**
   * Return the canonical URL to store in the database.
   * For cloud providers this would be the uploaded URL.
   * For the local stub this is an identity function after validation.
   */
  processImageUrl(url: string): Promise<string>;
}

// ── Local/stub implementation ──────────────────────────────────────────────

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_URL_LENGTH = 2048;

class LocalStorageProvider implements ImageStorageProvider {
  validateImageUrl(url: string): boolean {
    if (!url || url.length > MAX_URL_LENGTH) return false;

    // Must be a valid URL
    try {
      const parsed = new URL(url);
      // Only allow http or https
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;

      // Check extension
      const pathname = parsed.pathname.toLowerCase();
      return ALLOWED_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }

  async processImageUrl(url: string): Promise<string> {
    // Stub: simply return the URL as-is after validation
    return url.trim();
  }
}

// ── Export the active provider ─────────────────────────────────────────────

export const storageProvider: ImageStorageProvider = new LocalStorageProvider();
