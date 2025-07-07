import { Loader2 } from 'lucide-react';

/**
 * A loading spinner component that can be used to indicate loading states.
 * @returns A loading spinner component
 */
export function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
