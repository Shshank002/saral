import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Video } from '@/lib/db';
import VideoGrid from '@/components/VideoGrid';
import { getChannelInitials, getChannelColor, formatViews } from '@/lib/utils';

export default function ChannelPage() {
  const router = useRouter();
  const { name } = router.query;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof name !== 'string') return;
    setLoading(true);
    fetch(`/api/channels/${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => {
        setVideos(data.videos || []);
        setLoading(false);
      });
  }, [name]);

  const channelName = typeof name === 'string' ? decodeURIComponent(name) : '';
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div>
      {/* Channel banner */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-saral-primary h-32 rounded-xl mb-6" />

      {/* Channel info */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 ${getChannelColor(channelName)}`}
        >
          {getChannelInitials(channelName)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{channelName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {videos.length} video{videos.length === 1 ? '' : 's'} ·{' '}
            {formatViews(totalViews).replace(' views', ' total views')}
          </p>
          <button className="mt-3 bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200">
            Subscribe
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex gap-6">
          <button className="py-3 border-b-2 border-white text-sm font-semibold">
            Videos
          </button>
          <button className="py-3 text-sm font-semibold text-gray-400 hover:text-white">
            About
          </button>
        </nav>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading channel...</p>
      ) : (
        <VideoGrid
          videos={videos}
          emptyMessage="This channel hasn't uploaded any videos yet"
        />
      )}
    </div>
  );
}
