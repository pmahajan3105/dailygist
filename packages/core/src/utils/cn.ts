import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind CSS classes
 * @param inputs - Class names to be combined and merged
 * @returns A single string of combined and optimized class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
