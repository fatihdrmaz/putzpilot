"use client";

// Paylaşılan temel bileşenler — mockup stili: sarı/siyah, yumuşak köşeler,
// flat (gölgesiz), dokunmatik öncelikli (min 44px hedefler).

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "outline" | "ghost" | "danger";
  loading?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-ink hover:bg-brand-dark active:scale-[0.98]",
    dark: "bg-ink text-white hover:bg-ink-soft active:scale-[0.98]",
    outline: "border-2 border-ink/15 bg-white text-ink hover:border-brand",
    ghost: "bg-transparent text-ink hover:bg-ink/5",
    danger: "bg-white border-2 border-danger/40 text-danger hover:bg-danger/5",
  };
  return (
    <button
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:pointer-events-none disabled:opacity-40 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-ink/10 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  helper,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {helper && !error && <p className="text-xs text-ink/50">{helper}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink/35 focus:border-brand focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-11 w-full cursor-pointer rounded-xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base text-ink focus:border-brand focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
        checked ? "bg-brand" : "bg-ink/15"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 cursor-pointer rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
        selected
          ? "border-brand bg-brand-soft text-ink"
          : "border-ink/10 bg-white text-ink/70 hover:border-ink/25"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Schritt ${current + 1} von ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? "w-6 bg-brand" : i < current ? "w-1.5 bg-brand" : "w-1.5 bg-ink/15"
          }`}
        />
      ))}
    </div>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const styles = {
    info: "bg-brand-soft text-ink border-brand/30",
    success: "bg-success/10 text-success border-success/30",
    error: "bg-danger/10 text-danger border-danger/30",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`}>
      {children}
    </div>
  );
}
