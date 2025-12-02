import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Converting your file...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-[#3366FF] animate-spin" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-100"></div>
      </div>
      <p className="mt-6 text-gray-600 font-medium text-center">{message}</p>
      <p className="mt-2 text-sm text-gray-500">This may take a few moments...</p>
      <div className="flex gap-2 mt-4">
        <div className="w-2 h-2 bg-[#3366FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#3366FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#3366FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
