import { Schema, model } from 'mongoose';

export interface ICategory { name: string; slug: string; description: string; order: number; }

const schema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Category = model<ICategory>('Category', schema);
