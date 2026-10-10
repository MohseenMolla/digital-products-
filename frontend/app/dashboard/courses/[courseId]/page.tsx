'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Download } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { CourseSidebar, type CModule } from '@/components/CourseSidebar';
import { LessonPlayer } from '@/components/LessonPlayer';

interface Course { id: string; title: string; modules: CModule[]; progress: { completedLessons: string[]; progressPercentage: number; lastLesson: string | null }; }

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>(); const toast = useToast();
  const { data, loading, error, reload } = useFetch<Course>(`/courses/${courseId}`);
  const [current, setCurrent] = useState(''); const [done, setDone] = useState<Set<string>>(new Set()); const [pct, setPct] = useState(0); const [busy, setBusy] = useState(false);
  const lessons = useMemo(() => data?.modules.flatMap((m) => m.lessons) ?? [], [data]);

  useEffect(() => {
    if (!data) return;
    setDone(new Set(data.progress.completedLessons)); setPct(data.progress.progressPercentage);
    setCurrent(data.progress.lastLesson && lessons.some((l) => l.id === data.progress.lastLesson) ? data.progress.lastLesson : lessons[0]?.id ?? '');
  }, [data, lessons]);

  if (loading) return <PageLoader />;
  if (error || !data) return <div className="mx-auto max-w-xl space-y-4"><ErrorState message={error || 'Unable to load course'} onRetry={reload} /><Link href="/dashboard/courses" className="text-sm font-semibold text-brand-700">Back to my courses</Link></div>;

  const idx = lessons.findIndex((l) => l.id === current);
  const lesson = lessons[idx];
  const isDone = lesson ? done.has(lesson.id) : false;

  async function toggle() {
    if (!lesson) return; setBusy(true);
    try {
      const r = await api.post(`/courses/${courseId}/progress`, { lessonId: lesson.id, completed: !isDone });
      setDone(new Set(r.data.data.completedLessons as string[])); setPct(r.data.data.progressPercentage as number);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  async function select(id: string) { setCurrent(id); void api.post(`/courses/${courseId}/progress`, { lessonId: id, completed: done.has(id) }).catch(() => undefined); }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/dashboard/courses" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{data.title}</h1>
        <div className="flex w-full items-center gap-2 sm:w-56"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} /></div><span className="text-xs font-semibold text-slate-600">{pct}%</span></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {lesson ? (
            <>
              <LessonPlayer key={lesson.id} videoUrl={lesson.videoUrl} title={lesson.title} />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-semibold">{lesson.title}</h2>
                <Button variant={isDone ? 'secondary' : 'primary'} size="sm" loading={busy} onClick={toggle}><Check className="h-4 w-4" />{isDone ? 'Completed' : 'Mark complete'}</Button></div>
              {lesson.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{lesson.description}</p>}
              {lesson.resources.length > 0 && (
                <div className="mt-5"><p className="font-semibold">Resources</p><ul className="mt-2 space-y-2">{lesson.resources.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline"><Download className="h-4 w-4" />{r.name}</a></li>)}</ul></div>
              )}
              <div className="mt-6 flex justify-between">
                <Button variant="secondary" disabled={idx <= 0} onClick={() => void select(lessons[idx - 1].id)}><ArrowLeft className="h-4 w-4" />Previous</Button>
                <Button disabled={idx >= lessons.length - 1} onClick={() => void select(lessons[idx + 1].id)}>Next<ArrowRight className="h-4 w-4" /></Button>
              </div>
            </>
          ) : <ErrorState message="This course has no lessons yet." />}
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 lg:max-h-[75vh] lg:overflow-y-auto"><CourseSidebar modules={data.modules} currentId={current} completed={done} onSelect={(id) => void select(id)} /></aside>
      </div>
    </div>
  );
}
