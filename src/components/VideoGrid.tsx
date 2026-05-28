import { Video } from '@/lib/db';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  emptyMessage?: string;
}

export default function VideoGrid({ videos, emptyMessage = 'No videos found' }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    // Inline styles as backup - guaranteed 2 columns mobile, more on larger
    <div
      className="saral-video-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '16px 8px',
        padding: '0 8px',
      }}
    >
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
