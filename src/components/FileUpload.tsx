import { Upload } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  error: string;
}

export function FileUpload({ onFileSelect, selectedFile, error }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="file-upload"
        className={`
          block w-full p-8 border-2 border-dashed rounded-xl
          cursor-pointer transition-smooth text-center
          ${isDragging
            ? 'border-[#3366FF] bg-blue-50'
            : 'border-gray-300 bg-[#F8F9FA] hover:border-[#3366FF] hover:bg-blue-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload PDF file"
        tabIndex={0}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="PDF file input"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <Upload className="w-6 h-6 text-[#3366FF]" />
          </div>
          <div>
            <p className="text-base font-medium text-gray-700">
              {selectedFile ? selectedFile.name : 'Drop your PDF here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PDF files only, up to 50MB
            </p>
          </div>
        </div>
      </label>
      {error && (
        <p className="text-sm text-red-600 animate-fade-in" role="alert">
          {error}
        </p>
      )}
      {selectedFile && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <p className="text-sm text-green-700 font-medium">
            File selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}
    </div>
  );
}
