import { CheckCircle, Download, XCircle } from 'lucide-react';

interface ConversionResultProps {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
  onReset: () => void;
}

export function ConversionResult({
  success,
  message,
  downloadUrl,
  fileName,
  onReset,
}: ConversionResultProps) {
  const handleDownload = () => {
    if (downloadUrl && fileName) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`
      p-6 rounded-xl border-2 animate-fade-in
      ${success
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
      }
    `}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          success ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {success ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-1 ${
            success ? 'text-green-900' : 'text-red-900'
          }`}>
            {success ? 'Conversion Successful!' : 'Conversion Failed'}
          </h3>
          <p className={`text-sm mb-4 ${
            success ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>
          {success && downloadUrl && (
            <button
              onClick={handleDownload}
              className="
                inline-flex items-center gap-2 px-6 py-2.5
                bg-[#3366FF] hover:bg-blue-600
                text-white font-medium rounded-full
                transition-smooth focus:outline-none focus:ring-2
                focus:ring-[#3366FF] focus:ring-offset-2
                active:scale-95
              "
              aria-label="Download converted file"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onReset}
        className="
          mt-4 w-full text-center text-sm font-medium
          text-gray-600 hover:text-gray-900 transition-smooth
          py-2 px-4 rounded-lg hover:bg-white
        "
      >
        Convert Another File
      </button>
    </div>
  );
}
