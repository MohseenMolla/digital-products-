'use client';

function embedUrl(url: string): { type: 'iframe' | 'video'; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}` };
    if (u.hostname === 'youtu.be') return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed${u.pathname}` };
    if (u.hostname.includes('vimeo.com')) { const id = u.pathname.split('/').filter(Boolean).pop(); return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` }; }
    return { type: 'video', src: url };
  } catch { return null; }
}

export function LessonPlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const v = embedUrl(videoUrl);
  if (!v) return <div className="grid aspect-video place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">No video for this lesson</div>;
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      {v.type === 'iframe'
        ? <iframe src={v.src} title={title} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <video src={v.src} controls controlsList="nodownload" className="h-full w-full" />}
    </div>
  );
}
