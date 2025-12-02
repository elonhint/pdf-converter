export interface ConversionResult {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

export async function convertPDF(
  file: File,
  format: string
): Promise<ConversionResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/pdf-converter`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Conversion failed');
  }

  const binaryString = atob(data.file);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: data.mimeType });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    success: true,
    message: data.message,
    downloadUrl,
    fileName: data.filename,
  };
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    rtf: 'application/rtf',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    jfif: 'image/jpeg',
    png: 'image/png',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  return mimeTypes[format] || 'application/octet-stream';
}
