import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

const base = 'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50';

function Field({ label, error, hint, children }: { label?: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, ...rest }, ref) {
  return <Field label={label} error={error} hint={hint}><input ref={ref} className={cn(base, 'h-11', error && 'border-red-400', className)} {...rest} /></Field>;
});

interface TAProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; hint?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TAProps>(function Textarea({ label, error, hint, className, ...rest }, ref) {
  return <Field label={label} error={error} hint={hint}><textarea ref={ref} className={cn(base, 'py-2', className)} rows={4} {...rest} /></Field>;
});

interface SelProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; }
export const Select = forwardRef<HTMLSelectElement, SelProps>(function Select({ label, error, className, children, ...rest }, ref) {
  return <Field label={label} error={error}><select ref={ref} className={cn(base, 'h-11', className)} {...rest}>{children}</select></Field>;
});
