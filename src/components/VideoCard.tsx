import Link from 'next/link';
import { Video } from '@/lib/db';
import { formatViews, formatTimeAgo, getChannelInitials, getChannelColor } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/watch/${video.id}`} className="block group">
      {/* Thumbnail - 16:9 aspect ratio with smart background */}
      <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg sm:rounded-xl">
        {/* Blurred background of same image (fills the bars) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-50"
          loading="lazy"
        />
        {/* Foreground actual image - full content visible (no crop) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/600x340/272727/FFFFFF?text=${encodeURIComponent(video.title.slice(0, 20))}`;
          }}
        />
        {video.duration && (
          <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 bg-black bg-opacity-80 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded z-10">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info - compact for 2-column mobile grid */}
      <div className="mt-2 flex gap-2 sm:gap-3">
        <div
          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] sm:text-sm font-semibold ${getChannelColor(video.channelName)}`}
        >
          {getChannelInitials(video.channelName)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-blue-400 leading-tight sm:leading-snug">
            {video.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
            {video.channelName}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">
            {formatViews(video.views)} · {formatTimeAgo(video.uploadedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
