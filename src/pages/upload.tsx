import { useState, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { UPLOAD_LIMITS, formatDuration } from '@/lib/limits';

interface UploadStatus {
  videos: { used: number; limit: number; remaining: number };
  shorts: { used: number; limit: number; remaining: number };
}

// Read video duration from a File using HTML5 video metadata
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata'));
    };
    video.src = url;
  });
}

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [channelName, setChannelName] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isShort, setIsShort] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [durationError, setDurationError] = useState('');
  const [status, setStatus] = useState<UploadStatus | null>(null);

  // Fetch upload status whenever channelName changes (debounced)
  const refreshStatus = useCallback((name: string) => {
    const effectiveName = name.trim() || 'Anonymous User';
    fetch(`/api/upload-status?channelName=${encodeURIComponent(effectiveName)}`)
      .then(r => r.json())
      .then((data: UploadStatus) => setStatus(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => refreshStatus(channelName), 400);
    return () => clearTimeout(t);
  }, [channelName, refreshStatus]);

  // When video file changes, read its duration and validate
  useEffect(() => {
    setDurationError('');
    if (!videoFile) {
      setVideoDuration(null);
      return;
    }
    let cancelled = false;
    getVideoDuration(videoFile)
      .then(d => {
        if (cancelled) return;
        setVideoDuration(d);
        validateDuration(d, isShort);
      })
      .catch(() => {
        if (cancelled) return;
        setVideoDuration(null);
        // Don't error - some formats may not be readable in browser
      });
    return () => { cancelled = true; };
  }, [videoFile]);

  // Re-validate duration when isShort toggle changes
  useEffect(() => {
    if (videoDuration != null) {
      validateDuration(videoDuration, isShort);
    }
  }, [isShort, videoDuration]);

  function validateDuration(d: number, asShort: boolean) {
    const limit = asShort
      ? UPLOAD_LIMITS.MAX_SHORT_DURATION_SEC
      : UPLOAD_LIMITS.MAX_VIDEO_DURATION_SEC;
    if (d > limit) {
      const limitLabel = asShort ? '1 minute' : '3 hours';
      setDurationError(
        `This file is ${formatDuration(d)} long. ${asShort ? 'Shorts' : 'Videos'} must be under ${limitLabel}.`
      );
    } else {
      setDurationError('');
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (durationError) {
      setError(durationError);
      return;
    }
    // Client-side daily limit check
    if (status) {
      const remaining = isShort ? status.shorts.remaining : status.videos.remaining;
      if (remaining <= 0) {
        const type = isShort ? 'shorts' : 'videos';
        const limit = isShort ? status.shorts.limit : status.videos.limit;
        setError(`Daily limit reached: you can upload only ${limit} ${type} per 24 hours. Try again tomorrow.`);
        return;
      }
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('channelName', channelName || 'Anonymous User');
    formData.append('isShort', isShort ? 'true' : 'false');
    if (videoDuration != null) {
      formData.append('durationSec', String(videoDuration));
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success && data.video) {
            if (data.video.isShort) {
              router.push('/shorts');
            } else {
              router.push(`/watch/${data.video.id}`);
            }
          }
        } catch {
          setError('Upload succeeded but response was invalid');
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || 'Upload failed');
        } catch {
          setError('Upload failed');
        }
        // Refresh status in case limit was hit server-side
        refreshStatus(channelName);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error during upload');
    };

    xhr.send(formData);
  };

  // Compute limit info for the currently selected type
  const currentLimit = status
    ? (isShort ? status.shorts : status.videos)
    : null;
  const maxDurationSec = isShort
    ? UPLOAD_LIMITS.MAX_SHORT_DURATION_SEC
    : UPLOAD_LIMITS.MAX_VIDEO_DURATION_SEC;
  const maxDurationLabel = isShort ? '1 minute' : '3 hours';

  const dailyLimitReached = currentLimit != null && currentLimit.remaining <= 0;
  const canSubmit =
    !uploading &&
    !!videoFile &&
    !!title.trim() &&
    !durationError &&
    !dailyLimitReached;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Video to SARAL</h1>

      {/* Daily upload status banner */}
      {status && (
        <div className="bg-saral-gray rounded-lg p-4 mb-6 border border-gray-700">
          <p className="text-sm font-semibold mb-3">Your daily upload status</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <UploadStatBox
              label="Videos today"
              used={status.videos.used}
              limit={status.videos.limit}
              maxLengthLabel="Max 3 hours each"
            />
            <UploadStatBox
              label="Shorts today"
              used={status.shorts.used}
              limit={status.shorts.limit}
              maxLengthLabel="Max 1 minute each"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Video File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="video/*"
              onChange={e => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
              id="video-input"
            />
            <label htmlFor="video-input" className="cursor-pointer block">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {videoFile ? (
                <div>
                  <p className="text-blue-400 font-semibold">{videoFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    {videoDuration != null && ` - Duration: ${formatDuration(videoDuration)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Click to select video</p>
                  <p className="text-xs text-gray-400 mt-1">
                    MP4, WebM, MOV - Up to 500MB - Max {maxDurationLabel}
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Duration error inline */}
          {durationError && (
            <p className="text-red-400 text-sm mt-2 flex items-start gap-1">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {durationError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Thumbnail (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-saral-gray file:text-white hover:file:bg-gray-700"
          />
          {thumbnailFile && <p className="text-xs text-gray-400 mt-1">{thumbnailFile.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a title that describes your video"
            maxLength={100}
            className="w-full bg-saral-gray border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell viewers about your video"
            rows={4}
            maxLength={5000}
            className="w-full bg-saral-gray border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Channel Name</label>
          <input
            type="text"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            placeholder="Your channel name (used for daily upload limits)"
            maxLength={50}
            className="w-full bg-saral-gray border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Limits are tracked per channel name. Leaving blank groups you with "Anonymous User".
          </p>
        </div>

        <div className="bg-saral-gray rounded-lg p-4 border border-gray-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isShort}
              onChange={e => setIsShort(e.target.checked)}
              className="mt-1 w-5 h-5 accent-saral-primary cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-saral-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h7v8l10-12h-7V2z" />
                </svg>
                <span className="font-semibold">Upload as a Short</span>
              </div>
              <p className="text-xs text-gray-400">
                Shorts are vertical videos (9:16). Max length: 1 minute. Max 3 shorts per day.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Regular videos: max 3 hours, max 2 per day.
              </p>
            </div>
          </label>
        </div>

        {/* Daily limit reached warning */}
        {dailyLimitReached && (
          <div className="bg-orange-900 bg-opacity-50 border border-orange-700 text-orange-200 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">Daily limit reached</p>
            <p>
              You've used all {currentLimit?.limit} {isShort ? 'shorts' : 'videos'} for today.
              Switch to {isShort ? 'video' : 'shorts'} or try again in 24 hours.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {uploading && (
          <div>
            <p className="text-sm mb-1">Uploading... {progress}%</p>
            <div className="w-full bg-saral-gray rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={uploading}
            className="px-6 py-2 rounded-full hover:bg-saral-gray disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-semibold"
          >
            {uploading ? 'Uploading...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

// === Reusable stat box ===
interface UploadStatBoxProps {
  label: string;
  used: number;
  limit: number;
  maxLengthLabel: string;
}

function UploadStatBox({ label, used, limit, maxLengthLabel }: UploadStatBoxProps) {
  const remaining = Math.max(0, limit - used);
  const isFull = remaining === 0;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <div className={`rounded-lg p-3 ${isFull ? 'bg-red-900 bg-opacity-30 border border-red-800' : 'bg-saral-dark border border-gray-700'}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${isFull ? 'text-red-400' : 'text-white'}`}>
        {used} / {limit}
      </p>
      <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
        <div
          className={`h-1 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">{maxLengthLabel}</p>
      {!isFull && (
        <p className="text-xs text-green-400 mt-0.5">{remaining} remaining</p>
      )}
    </div>
  );
}
