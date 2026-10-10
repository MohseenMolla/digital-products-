import type { Request, Response } from 'express';
import { CourseProgress } from '../models/CourseProgress';
import { Product } from '../models/Product';
import { requireActivePurchase } from '../services/access.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

async function loadCourse(userId: string, productId: string) {
  await requireActivePurchase(userId, productId);
  const p = await Product.findById(productId);
  if (!p || !p.courseModules.length) throw new AppError(404, 'This product has no course content', 'NOT_FOUND');
  return p;
}

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const p = await loadCourse(String(req.user!._id), req.params.productId);
  const prog = await CourseProgress.findOne({ user: req.user!._id, course: p._id });
  ok(res, {
    id: String(p._id), title: p.title,
    modules: p.courseModules.map((m) => ({
      id: String(m._id), title: m.title,
      lessons: m.lessons.map((l) => ({ id: String(l._id), title: l.title, videoUrl: l.videoUrl, description: l.description, duration: l.duration, resources: l.resources })),
    })),
    progress: { completedLessons: (prog?.completedLessons ?? []).map(String), progressPercentage: prog?.progressPercentage ?? 0, lastLesson: prog?.lastLesson ? String(prog.lastLesson) : null },
  });
});

export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId, completed } = req.body as { lessonId: string; completed: boolean };
  const p = await loadCourse(String(req.user!._id), req.params.productId);
  const all = p.courseModules.flatMap((m) => m.lessons.map((l) => String(l._id)));
  if (!all.includes(lessonId)) throw new AppError(404, 'Lesson not found', 'NOT_FOUND');
  const prog = (await CourseProgress.findOne({ user: req.user!._id, course: p._id })) ?? new CourseProgress({ user: req.user!._id, course: p._id, completedLessons: [] });
  const set = new Set(prog.completedLessons.map(String).filter((id) => all.includes(id)));
  if (completed) set.add(lessonId); else set.delete(lessonId);
  prog.completedLessons = [...set] as never;
  prog.progressPercentage = all.length ? Math.round((set.size / all.length) * 100) : 0;
  prog.lastLesson = lessonId as never;
  await prog.save();
  ok(res, { completedLessons: [...set], progressPercentage: prog.progressPercentage, lastLesson: lessonId });
});
