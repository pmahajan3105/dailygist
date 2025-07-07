import React from 'react';

interface ErrorProps {
  /** The error message to display */
  message: string;
  /** Optional function to retry the failed action */
  retry?: () => void;
}

/**
 * A component to display error messages with an optional retry button
 * @param props - The component props
 * @returns An error message component with optional retry button
 */
export function Error({ message, retry }: ErrorProps) {
  return (
    <div className="rounded-lg bg-red-50 p-4">
      <p className="text-sm text-red-800">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-2 text-sm font-medium text-red-800 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
