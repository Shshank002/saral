import { useRouter } from 'next/router';
import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { Video, Comment } from '@/lib/db';
import { formatViews, formatTimeAgo, getChannelInitials, getChannelColor } from '@/lib/utils';
import VideoCard from '@/components/VideoCard';

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('Guest');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    setLoading(true);
    // Fetch video
    fetch(`/api/videos/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.video) {
          setVideo(data.video);
          // Increment view count
          fetch(`/api/videos/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'view' }),
          });
        }
        setLoading(false);
      });

    // Fetch comments
    fetch(`/api/comments/${id}`)
      .then(r => r.json())
      .then(data => setComments(data.comments || []));

    // Fetch related videos
    fetch('/api/videos')
      .then(r => r.json())
      .then(data => {
        const others = (data.videos || []).filter((v: Video) => v.id !== id).slice(0, 10);
        setRelatedVideos(others);
      });
  }, [id]);

  const handleLike = async () => {
    if (!video || liked) return;
    const res = await fetch(`/api/videos/${video.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    });
    const data = await res.json();
    if (data.video) {
      setVideo(data.video);
      setLiked(true);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !video) return;
    const res = await fetch(`/api/comments/${video.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: commentAuthor, text: commentText }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments([data.comment, ...comments]);
      setCommentText('');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="aspect-video bg-saral-gray rounded-xl mb-4" />
        <div className="h-6 bg-saral-gray rounded w-3/4 mb-2" />
        <div className="h-4 bg-saral-gray rounded w-1/2" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl mb-4">Video not found</h2>
        <Link href="/" className="text-blue-400 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto">
      {/* Main column: video + info + comments */}
      <div className="flex-1 min-w-0">
        {/* Video player */}
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <video
            key={video.id}
            src={video.videoUrl}
            controls
            autoPlay
            className="w-full h-full"
            poster={video.thumbnailUrl}
          >
            Your browser does not support video playback.
          </video>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold mt-4 mb-3">{video.title}</h1>

        {/* Channel + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-800">
          <Link
            href={`/channel/${encodeURIComponent(video.channelName)}`}
            className="flex items-center gap-3 group"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getChannelColor(video.channelName)}`}
            >
              {getChannelInitials(video.channelName)}
            </div>
            <div>
              <p className="font-semibold group-hover:text-blue-400">
                {video.channelName}
              </p>
              <p className="text-xs text-gray-400">Channel</p>
            </div>
            <button className="ml-4 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200">
              Subscribe
            </button>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 bg-saral-gray hover:bg-gray-700 px-4 py-2 rounded-full text-sm ${
                liked ? 'text-blue-400' : ''
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              {video.likes}
            </button>
            <button className="flex items-center gap-2 bg-saral-gray hover:bg-gray-700 px-4 py-2 rounded-full text-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-saral-gray p-4 rounded-xl my-4">
          <p className="text-sm text-gray-300 mb-2 font-semibold">
            {formatViews(video.views)} · {formatTimeAgo(video.uploadedAt)}
          </p>
          <p className="text-sm whitespace-pre-wrap">{video.description}</p>
        </div>

        {/* Comments section */}
        <div className="my-6">
          <h3 className="text-lg font-semibold mb-4">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h3>

          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-saral-primary rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                {commentAuthor[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent border-b border-gray-700 focus:border-white text-sm py-1 mb-2 focus:outline-none"
                />
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-b border-gray-700 focus:border-white text-sm py-2 focus:outline-none"
                />
                {commentText.trim() && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCommentText('')}
                      className="px-3 py-1.5 text-sm rounded-full hover:bg-saral-gray"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                      disabled={!commentText.trim()}
                    >
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getChannelColor(c.author)}`}
                  >
                    {c.author[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{c.author}</span>
                      <span className="text-gray-400 text-xs">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-gray-200">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar: related videos */}
      <aside className="lg:w-96 flex-shrink-0">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Up Next</h3>
        <div className="space-y-3">
          {relatedVideos.map(v => (
            <Link
              key={v.id}
              href={`/watch/${v.id}`}
              className="flex gap-2 group"
            >
              <div className="w-40 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-saral-gray">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnailUrl}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/600x340/272727/FFFFFF?text=${encodeURIComponent(v.title.slice(0, 20))}`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-blue-400">
                  {v.title}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{v.channelName}</p>
                <p className="text-xs text-gray-400">
                  {formatViews(v.views)} · {formatTimeAgo(v.uploadedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
