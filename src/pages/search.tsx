import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Video } from '@/lib/db';
import VideoGrid from '@/components/VideoGrid';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof q !== 'string') return;
    setLoading(true);
    fetch(`/api/videos?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        setVideos(data.videos || []);
        setLoading(false);
      });
  }, [q]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">
        Search results for: <span className="text-blue-400">"{q}"</span>
      </h1>
      {loading ? (
        <p className="text-gray-400">Searching...</p>
      ) : (
        <VideoGrid
          videos={videos}
          emptyMessage={`No videos found matching "${q}"`}
        />
      )}
    </div>
  );
}
