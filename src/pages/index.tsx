import { useEffect, useState } from 'react';
import { Video } from '@/lib/db';
import VideoGrid from '@/components/VideoGrid';
import ShortsRow from '@/components/ShortsRow';

const CATEGORIES = ['All', 'Music', 'Tech', 'Gaming', 'Cooking', 'Travel', 'Education', 'News'];

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    Promise.all([
      fetch('/api/videos?type=regular').then(r => r.json()),
      fetch('/api/shorts').then(r => r.json()),
    ])
      .then(([videosData, shortsData]) => {
        setVideos(videosData.videos || []);
        setShorts(shortsData.shorts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load homepage data', err);
        setLoading(false);
      });
  }, []);

  const firstChunk = videos.slice(0, 4);
  const restVideos = videos.slice(4);

  return (
    <div>
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 sticky top-14 bg-saral-dark z-30 px-3 sm:px-0 py-2 sm:py-3 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-white text-black'
                : 'bg-saral-gray text-white hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-saral-gray rounded-xl" />
              <div className="mt-3 flex gap-3">
                <div className="w-9 h-9 bg-saral-gray rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-saral-gray rounded w-full" />
                  <div className="h-3 bg-saral-gray rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {firstChunk.length > 0 && <VideoGrid videos={firstChunk} />}
          {shorts.length > 0 && <ShortsRow shorts={shorts} />}
          {restVideos.length > 0 && <VideoGrid videos={restVideos} />}
          {videos.length === 0 && shorts.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p>No videos yet. Upload one to get started!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
