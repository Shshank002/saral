import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Video } from '@/lib/db';
import { formatViews, getChannelInitials, getChannelColor } from '@/lib/utils';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Fetch shorts on mount
  useEffect(() => {
    fetch('/api/shorts')
      .then(r => r.json())
      .then(data => {
        setShorts(data.shorts || []);
        setLoading(false);
      });
  }, []);

  // Auto play/pause based on currentIndex
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx === currentIndex) {
        v.currentTime = 0;
        v.play().catch(() => {
          // Browser may block autoplay, that's ok
        });
      } else {
        v.pause();
      }
    });

    // Track view on the current video
    const current = shorts[currentIndex];
    if (current) {
      fetch(`/api/videos/${current.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      });
    }
  }, [currentIndex, shorts]);

  // Detect scroll to figure out which short is active
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const idx = Math.round(scrollTop / height);
    if (idx !== currentIndex && idx >= 0 && idx < shorts.length) {
      setCurrentIndex(idx);
    }
  };

  // Keyboard navigation (arrow up/down)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(Math.min(currentIndex + 1, shorts.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(Math.max(currentIndex - 1, 0));
      } else if (e.key === 'm') {
        setMuted(m => !m);
      } else if (e.key === ' ') {
        e.preventDefault();
        const v = videoRefs.current[currentIndex];
        if (v) {
          if (v.paused) v.play();
          else v.pause();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, shorts.length]);

  const scrollToIndex = (idx: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: idx * containerRef.current.clientHeight,
      behavior: 'smooth',
    });
  };

  const handleLike = async (videoId: string) => {
    if (likedIds.has(videoId)) return;
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    });
    const data = await res.json();
    if (data.video) {
      setShorts(prev =>
        prev.map(s => (s.id === videoId ? data.video : s))
      );
      setLikedIds(prev => new Set(prev).add(videoId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-gray-400">Loading shorts...</div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] text-gray-400">
        <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-lg">No shorts available yet</p>
        <Link href="/upload" className="text-blue-400 hover:underline mt-2">
          Upload your first short
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-3.5rem)] -mx-4 -my-6 overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {shorts.map((short, idx) => (
        <ShortItem
          key={short.id}
          short={short}
          isActive={idx === currentIndex}
          isLiked={likedIds.has(short.id)}
          muted={muted}
          onLike={() => handleLike(short.id)}
          onToggleMute={() => setMuted(m => !m)}
          videoRef={(el) => { videoRefs.current[idx] = el; }}
        />
      ))}

      {/* Navigation hints (desktop only) */}
      <div className="fixed right-4 bottom-20 text-xs text-gray-500 hidden md:block pointer-events-none">
        <p>↑ ↓ to navigate</p>
        <p>Space to pause · M to mute</p>
      </div>
    </div>
  );
}

// === Single short item ===
interface ShortItemProps {
  short: Video;
  isActive: boolean;
  isLiked: boolean;
  muted: boolean;
  onLike: () => void;
  onToggleMute: () => void;
  videoRef: (el: HTMLVideoElement | null) => void;
}

function ShortItem({ short, isActive, isLiked, muted, onLike, onToggleMute, videoRef }: ShortItemProps) {
  return (
    <div
      className="snap-start h-[calc(100vh-3.5rem)] w-full flex items-center justify-center relative"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Vertical video container - constrained to 9:16 aspect */}
      <div className="relative h-full max-h-full aspect-[9/16] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={short.videoUrl}
          loop
          muted={muted}
          playsInline
          className="w-full h-full object-cover cursor-pointer"
          onClick={(e) => {
            const v = e.currentTarget;
            if (v.paused) v.play();
            else v.pause();
          }}
          poster={short.thumbnailUrl}
        />

        {/* Overlay - bottom-left: title, channel info */}
        <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
          <Link
            href={`/channel/${encodeURIComponent(short.channelName)}`}
            className="flex items-center gap-2 pointer-events-auto mb-2"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${getChannelColor(short.channelName)}`}
            >
              {getChannelInitials(short.channelName)}
            </div>
            <span className="text-sm font-semibold text-white">
              @{short.channelName}
            </span>
            <button
              className="ml-2 bg-white text-black px-3 py-0.5 rounded-full text-xs font-semibold pointer-events-auto hover:bg-gray-200"
              onClick={(e) => e.preventDefault()}
            >
              Subscribe
            </button>
          </Link>
          <p className="text-white text-sm line-clamp-2">{short.title}</p>
          <p className="text-gray-300 text-xs mt-1">{formatViews(short.views)}</p>
        </div>

        {/* Right side action buttons */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
          {/* Like */}
          <button
            onClick={onLike}
            className="flex flex-col items-center"
            aria-label="Like"
          >
            <div className={`w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center ${isLiked ? 'text-red-500' : 'text-white'}`}>
              <svg className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white text-xs mt-1">{formatLikeCount(short.likes)}</span>
          </button>

          {/* Comments */}
          <Link href={`/watch/${short.id}`} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white text-xs mt-1">Comments</span>
          </Link>

          {/* Share */}
          <button className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span className="text-white text-xs mt-1">Share</span>
          </button>

          {/* Mute toggle */}
          <button onClick={onToggleMute} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
              {muted ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLikeCount(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1000000).toFixed(1)}M`;
}
