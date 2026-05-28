// Upload limits for SARAL
// These are enforced both on the client (UX) and server (security)

export const UPLOAD_LIMITS = {
  // Maximum number of regular videos a user can upload per 24 hours
  MAX_VIDEOS_PER_DAY: 2,

  // Maximum number of shorts a user can upload per 24 hours
  MAX_SHORTS_PER_DAY: 3,

  // Maximum duration for a regular video (seconds) - 3 hours
  MAX_VIDEO_DURATION_SEC: 3 * 60 * 60, // 10800 seconds

  // Maximum duration for a short (seconds) - 1 minute
  MAX_SHORT_DURATION_SEC: 60,
} as const;

// Format seconds as MM:SS or HH:MM:SS
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
