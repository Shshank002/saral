import Link from 'next/link';
import { Video } from '@/lib/db';
import { formatViews, getChannelInitials, getChannelColor } from '@/lib/utils';

interface ShortsRowProps {
  shorts: Video[];
}

export default function ShortsRow({ shorts }: ShortsRowProps) {
  if (shorts.length === 0) return null;

  return (
    <section className="my-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-7 h-7 text-saral-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L3 14h7v8l10-12h-7V2z" />
        </svg>
        <h2 className="text-xl font-bold">Shorts</h2>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
        {shorts.map(short => (
          <Link
            key={short.id}
            href="/shorts"
            className="flex-shrink-0 w-40 group snap-start"
          >
            {/* Vertical thumbnail (9:16 aspect) */}
            <div className="relative w-40 h-72 rounded-xl overflow-hidden bg-saral-gray">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={short.thumbnailUrl}
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/400x720/272727/FFFFFF?text=${encodeURIComponent(short.title.slice(0, 20))}`;
                }}
              />
              {/* Shorts badge */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h7v8l10-12h-7V2z" />
                </svg>
                SHORTS
              </div>
              {/* Bottom overlay with info */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-xs font-semibold line-clamp-2 mb-1">
                  {short.title}
                </p>
                <div className="flex items-center gap-1 text-gray-300 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${getChannelColor(short.channelName)}`}
                  >
                    {getChannelInitials(short.channelName)[0]}
                  </div>
                  <span className="truncate">{formatViews(short.views)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {/* See all card */}
        <Link
          href="/shorts"
          className="flex-shrink-0 w-40 h-72 rounded-xl bg-saral-gray hover:bg-gray-700 flex flex-col items-center justify-center text-center px-4 snap-start"
        >
          <svg className="w-12 h-12 mb-2 text-saral-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h7v8l10-12h-7V2z" />
          </svg>
          <p className="text-sm font-semibold">See all Shorts</p>
          <p className="text-xs text-gray-400 mt-1">Swipe through →</p>
        </Link>
      </div>
    </section>
  );
}
