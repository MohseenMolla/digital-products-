'use client';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/format';

export interface CLesson { id: string; title: string; videoUrl: string; description: string; duration: string; resources: { name: string; url: string }[]; }
export interface CModule { id: string; title: string; lessons: CLesson[]; }

export function CourseSidebar({ modules, currentId, completed, onSelect }: { modules: CModule[]; currentId: string; completed: Set<string>; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      {modules.map((m) => (
        <div key={m.id}>
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">{m.title}</p>
          <ul className="mt-1">
            {m.lessons.map((l) => (
              <li key={l.id}>
                <button onClick={() => onSelect(l.id)} className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm', l.id === currentId ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-100')}>
                  {completed.has(l.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
                  <span className="flex-1">{l.title}</span><span className="text-xs text-slate-400">{l.duration}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
