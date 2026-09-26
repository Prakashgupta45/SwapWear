"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageProvider = void 0;
// ── Local/stub implementation ──────────────────────────────────────────────
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_URL_LENGTH = 2048;
class LocalStorageProvider {
    validateImageUrl(url) {
        if (!url || url.length > MAX_URL_LENGTH)
            return false;
        // Must be a valid URL
        try {
            const parsed = new URL(url);
            // Only allow http or https
            if (!['http:', 'https:'].includes(parsed.protocol))
                return false;
            // Check extension
            const pathname = parsed.pathname.toLowerCase();
            return ALLOWED_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
        }
        catch {
            return false;
        }
    }
    async processImageUrl(url) {
        // Stub: simply return the URL as-is after validation
        return url.trim();
    }
}
// ── Export the active provider ─────────────────────────────────────────────
exports.storageProvider = new LocalStorageProvider();
