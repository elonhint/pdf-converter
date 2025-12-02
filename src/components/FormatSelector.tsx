import { ChevronDown } from 'lucide-react';

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  disabled?: boolean;
}

const formats = [
  { value: 'doc', label: 'Word 97-2003 (DOC)' },
  { value: 'docx', label: 'Word Document (DOCX)' },
  { value: 'rtf', label: 'Rich Text Format (RTF)' },
  { value: 'ppt', label: 'PowerPoint 97-2003 (PPT)' },
  { value: 'pptx', label: 'PowerPoint (PPTX)' },
  { value: 'jpeg', label: 'JPEG Image (JPEG)' },
  { value: 'jpg', label: 'JPEG Image (JPG)' },
  { value: 'jfif', label: 'JPEG File (JFIF)' },
  { value: 'png', label: 'PNG Image (PNG)' },
  { value: 'xls', label: 'Excel 97-2003 (XLS)' },
  { value: 'xlsx', label: 'Excel Spreadsheet (XLSX)' },
  { value: 'txt', label: 'Text File (TXT)' },
];

export function FormatSelector({ selectedFormat, onFormatChange, disabled }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="format-select" className="block text-sm font-medium text-gray-700">
        Select Output Format
      </label>
      <div className="relative">
        <select
          id="format-select"
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value)}
          disabled={disabled}
          className="
            w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg
            text-gray-700 font-medium appearance-none cursor-pointer
            transition-smooth focus:outline-none focus:ring-2 focus:ring-[#3366FF]
            focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
            hover:border-[#3366FF]
          "
          aria-label="Select output format"
        >
          <option value="">Choose a format...</option>
          {formats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
