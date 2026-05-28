# SARAL — A YouTube-like Video Platform

**SARAL** (Hindi for "simple") is a full-stack YouTube-style video sharing platform built with Next.js, TypeScript, and Tailwind CSS. Upload videos, watch them with a real player, like, comment, search, and explore channels — all running locally on your machine.

## Features

- **Homepage** with video grid, category filters, and YouTube-style layout
- **Watch page** with HTML5 video player, view/like counts, comments, related videos
- **Upload page** with real file upload, progress bar, thumbnail support (up to 500MB videos)
- **Search** functionality across title, description, and channel name
- **Channel pages** showing all videos by a creator
- **Local JSON database** — no external DB needed
- **Local file storage** for uploaded videos
- **Responsive design** — works on mobile, tablet, desktop
- **Dark theme** like real YouTube

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Storage**: Local filesystem (`/public/uploads`) + JSON (`/data`)
- **File handling**: formidable (multipart uploads)

## Project Structure

```
Saral/
├── data/                      # JSON "database" (videos.json, comments.json)
├── public/
│   └── uploads/
│       ├── videos/            # Uploaded video files
│       └── thumbnails/        # Uploaded thumbnails
├── src/
│   ├── components/
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Header.tsx         # Top navbar with search
│   │   ├── Sidebar.tsx        # Left navigation
│   │   ├── VideoCard.tsx      # Single video card
│   │   └── VideoGrid.tsx      # Grid of video cards
│   ├── lib/
│   │   ├── db.ts              # Database helpers (JSON read/write)
│   │   └── utils.ts           # Formatters (views, time-ago, etc.)
│   ├── pages/
│   │   ├── api/
│   │   │   ├── videos/
│   │   │   │   ├── index.ts   # GET /api/videos (list/search)
│   │   │   │   └── [id].ts    # GET/POST /api/videos/:id
│   │   │   ├── comments/
│   │   │   │   └── [videoId].ts  # GET/POST comments
│   │   │   ├── channels/
│   │   │   │   └── [name].ts  # GET channel videos
│   │   │   └── upload.ts      # POST /api/upload (multipart)
│   │   ├── watch/[id].tsx     # Video watch page
│   │   ├── channel/[name].tsx # Channel page
│   │   ├── index.tsx          # Homepage
│   │   ├── search.tsx         # Search results page
│   │   ├── upload.tsx         # Upload form page
│   │   ├── _app.tsx           # App wrapper
│   │   └── _document.tsx      # HTML document
│   └── styles/
│       └── globals.css        # Global styles + Tailwind
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## Setup Instructions

### Prerequisites

You need **Node.js 18+** installed. Check by running:

```bash
node --version
```

If you don't have it, install from [nodejs.org](https://nodejs.org/).

### Step 1: Install dependencies

Open a terminal in the `Saral` folder and run:

```bash
npm install
```

This will install Next.js, React, Tailwind, and other dependencies (~2-3 minutes).

### Step 2: Run the development server

```bash
npm run dev
```

Open your browser at **http://localhost:3000** to see SARAL running!

The first time you load the page, sample videos will be automatically seeded.

### Step 3: Try it out

1. Browse the homepage — you'll see 8 sample videos
2. Click any video to watch it (uses Google's public sample videos)
3. Try liking and commenting
4. Go to **Upload** (top-right) and upload your own video file
5. After upload, you'll be redirected to your video's watch page
6. Click any channel name to see all videos from that channel

## How It Works

### Video Storage Flow

1. User selects a video file in the upload form
2. Browser sends it as `multipart/form-data` to `/api/upload`
3. `formidable` parses the file and saves it to `public/uploads/videos/<uuid>.mp4`
4. Metadata (title, description, channel) is saved to `data/videos.json`
5. Browser is redirected to `/watch/<video-id>`
6. The HTML5 `<video>` tag streams the file from `/uploads/videos/<uuid>.mp4`

### Data Storage

All data is stored in plain JSON files in the `data/` folder:

- `data/videos.json` — array of all videos with metadata
- `data/comments.json` — array of all comments

When you're ready to scale, you can replace `src/lib/db.ts` with a real database (PostgreSQL, MongoDB, Supabase) without changing any other code.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List all videos (`?q=` to search) |
| GET | `/api/videos/:id` | Get single video |
| POST | `/api/videos/:id` | Action: `view` or `like` |
| POST | `/api/upload` | Upload a new video (multipart) |
| GET | `/api/comments/:videoId` | Get comments for video |
| POST | `/api/comments/:videoId` | Add comment |
| GET | `/api/channels/:name` | Get videos by channel |

## Production Build

```bash
npm run build
npm start
```

## Next Steps to Add

Once you've got the basics working, here are good features to add next:

- **User authentication** (NextAuth.js with Google/email login)
- **Real database** (Supabase or Postgres + Prisma)
- **Cloud storage** for videos (Cloudflare R2, AWS S3) — local storage doesn't scale
- **Video transcoding** to multiple qualities (FFmpeg or Mux.com)
- **HLS streaming** for smooth playback
- **Subscriptions and notifications**
- **View history and watch later**
- **Recommendations algorithm**
- **Live streaming** (very advanced)

## Going Mobile

When you're ready for a mobile app, **React Native** can reuse 80%+ of this codebase:

1. Keep the Next.js backend (API routes) as-is
2. Build a React Native frontend that calls the same `/api/*` endpoints
3. Or wrap the web app as a PWA (Progressive Web App) for the fastest path

## Troubleshooting

- **"Module not found"**: Run `npm install` again
- **Port 3000 in use**: Run `npm run dev -- -p 3001` to use port 3001
- **Upload fails**: Check that `public/uploads/videos/` folder exists (it should be auto-created)
- **Videos won't play**: For uploaded videos, only MP4/WebM work reliably in browsers. Check the file format.
- **Tailwind classes not working**: Stop the dev server (Ctrl+C) and restart with `npm run dev`

## Credits

Sample videos courtesy of:
- [Google's Public Sample Videos](https://gist.github.com/jsturgis/3b19447b304616f18657)
- [Big Buck Bunny](https://peach.blender.org/) by Blender Foundation
- [Elephants Dream](https://orange.blender.org/) by Blender Foundation

Made with ❤️ in India 🇮🇳
