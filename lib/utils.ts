import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | number | boolean | null | undefined>) {
  return twMerge(clsx(...inputs));
}
