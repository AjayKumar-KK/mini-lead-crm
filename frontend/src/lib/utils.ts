import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pluck a non-empty string from a search-param value. */
export function readParam(params: URLSearchParams, key: string): string {
  const v = params.get(key);
  return v?.trim() ?? "";
}

/** Initials for an avatar circle — first letter of first two name tokens. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0]![0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]![0] : "";
  return (a + b).toUpperCase();
}

/** Stable color pick for an avatar based on the lead's id. */
export function avatarColorFor(seed: string): string {
  const palette = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-fuchsia-500",
    "bg-teal-500",
    "bg-indigo-500",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}
