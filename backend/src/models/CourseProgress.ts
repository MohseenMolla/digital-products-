import { Schema, model, Types } from 'mongoose';

export interface ICourseProgress {
  user: Types.ObjectId;
  course: Types.ObjectId;
  completedLessons: Types.ObjectId[];
  progressPercentage: number;
  lastLesson?: Types.ObjectId;
  updatedAt: Date;
}

const schema = new Schema<ICourseProgress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    progressPercentage: { type: Number, default: 0 },
    lastLesson: { type: Schema.Types.ObjectId },
  },
  { timestamps: true },
);
schema.index({ user: 1, course: 1 }, { unique: true });

export const CourseProgress = model<ICourseProgress>('CourseProgress', schema);
