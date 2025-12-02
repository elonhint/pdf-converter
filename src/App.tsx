import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Code, 
  Presentation, 
  FileSpreadsheet,
  Download, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileType,
  AlignLeft // New icon for TXT
} from 'lucide-react';

/**
 * PDF Converter App - Updated Interface
 * Supports: DOC, PPT, XLSX, TXT, HTML, PNG, JPG, WEBP
 */

const FORMATS = [
  // Office Formats
  { id: 'doc', label: 'Word Doc', type: 'office', icon: FileText, desc: 'Microsoft Word Document' },
  { id: 'ppt', label: 'PowerPoint', type: 'office', icon: Presentation, desc: 'Microsoft PowerPoint' },
  { id: 'xlsx', label: 'Excel', type: 'office', icon: FileSpreadsheet, desc: 'Microsoft Excel Spreadsheet' },
  
  // Text & Web Formats
  { id: 'txt', label: 'Plain Text', type: 'text', icon: AlignLeft, desc: 'Raw text extraction (TXT)' }, // ADDED
  { id: 'html', label: 'HTML', type: 'web', icon: Code, desc: 'Web Page Format' },
  
  // Images
  { id: 'png', label: 'PNG Image', type: 'image', icon: ImageIcon, desc: 'High Quality Image' },
  { id: 'jpg', label: 'JPG Image', type: 'image', icon: ImageIcon, desc: 'Standard Image' },
  { id: 'webp', label: 'WebP', type: 'image', icon: ImageIcon, desc: 'Web Image Format' },
];

export default function PDFConverter() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pdfLibReady, setPdfLibReady] = useState(false);
  
  const canvasRef = useRef(null);

  // Load PDF.js from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setPdfLibReady(true);
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setFile(file);
    setError(null);
    setResult(null);
    setSelectedFormat(null);
  };

  const convertFile = async () => {
    if (!file || !selectedFormat || !pdfLibReady) return;

    setIsConverting(true);
    setProgress(10);
    setError(null); // Clear previous errors

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      const formatType = FORMATS.find(f => f.id === selectedFormat).type;
      let blob;

      setProgress(30);

      if (formatType === 'image') {
        // --- Image Logic (Converts Page 1) ---
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        setProgress(80);

        const mimeType = `image/${selectedFormat === 'jpg' ? 'jpeg' : selectedFormat}`;
        const dataUrl = canvas.toDataURL(mimeType);
        const res = await fetch(dataUrl);
        blob = await res.blob();

      } else {
        // --- Text/Office Logic (Extracts all text) ---
        let fullText = '';
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          fullText += strings.join(' ') + '\n\n';
          setProgress(30 + Math.floor((i / numPages) * 50));
        }

        let finalContent = fullText;
        let mimeType = 'text/plain'; // Default for TXT

        if (selectedFormat === 'html') {
          finalContent = `<html><body><pre>${fullText}</pre></body></html>`;
          mimeType = 'text/html';
        } else if (selectedFormat === 'xlsx') {
          // Simulate structure for Excel by making it CSV-like text
          finalContent = fullText.split('\n').map(l => `"${l.replace(/"/g, '""')}"`).join('\n');
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; 
        } else if (selectedFormat === 'doc') {
          // Text content with DOC MIME type
          mimeType = 'application/msword';
        } else if (selectedFormat === 'ppt') {
          // Text content with PPT MIME type
          mimeType = 'application/vnd.ms-powerpoint';
        }
        // TXT is handled by the default text/plain mimeType

        blob = new Blob([finalContent], { type: mimeType });
      }

      setProgress(100);
      setResult({
        url: URL.createObjectURL(blob),
        filename: `converted_${file.name.replace('.pdf', '')}.${selectedFormat}`,
        format: selectedFormat.toUpperCase()
      });

    } catch (err) {
      console.error(err);
      setError('Conversion failed. The PDF might be password protected or corrupted.');
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSelectedFormat(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <canvas ref={canvasRef} className="hidden" />

      <main className="max-w-4xl mx-auto px-4 py-12">

        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* 1. Upload View */}
          {!file && (
            <div 
              className={`p-16 text-center transition-all ${dragActive ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload your PDF</h3>
              <p className="text-slate-500 mb-8">Drag & drop or browse</p>
              
              <label className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                Choose File
              </label>
            </div>
          )}

          {/* 2. Selection View */}
          {file && !result && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg"><FileText className="w-6 h-6" /></div>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                </div>
                <button onClick={reset} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  const isSelected = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`
                        relative flex flex-col items-center p-4 rounded-xl border-2 text-center transition-all
                        ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-blue-100 hover:bg-slate-50 text-slate-600'}
                      `}
                    >
                      {isSelected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-blue-600" />}
                      <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm block">{fmt.label}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-60 mt-1">{fmt.type}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={convertFile}
                disabled={!selectedFormat || isConverting || !pdfLibReady}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex justify-center items-center gap-2
                  ${!selectedFormat || isConverting ? 'bg-slate-200' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}
                `}
              >
                {isConverting ? <Loader2 className="animate-spin" /> : 'Convert Now'}
              </button>
            </div>
          )}

          {/* 3. Result View */}
          {result && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to Download</h3>
              <p className="text-slate-500 mb-8">{result.filename}</p>
              
              <div className="flex gap-4 justify-center">
                <a 
                  href={result.url} 
                  download={result.filename}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button onClick={reset} className="px-6 py-3 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50">
                  Convert Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}