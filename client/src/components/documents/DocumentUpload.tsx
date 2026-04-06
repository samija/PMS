import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';

export type DocumentType = 'agreement' | 'national_id' | 'passport' | 'other';

interface DocumentUploadProps {
  onUpload: (file: File, type: DocumentType, name: string) => Promise<void>;
  isUploading?: boolean;
}

const documentTypes = [
  { value: 'agreement', label: 'Lease Agreement' },
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'other', label: 'Other Document' },
];

export default function DocumentUpload({
  onUpload,
  isUploading = false,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('agreement');
  const [docName, setDocName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeMB = 10;
  const accept = 'image/jpeg,image/png,image/webp,application/pdf';

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024;
    const allowedTypes = accept.split(',');

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.';
    }

    if (file.size > maxSize) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (!docName) {
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim()) {
      setError('Please select a file and enter a document name');
      return;
    }

    try {
      await onUpload(selectedFile, docType, docName.trim());
      setSelectedFile(null);
      setDocName('');
      setDocType('agreement');
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setDocName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPDF = selectedFile?.type === 'application/pdf';

  return (
    <div className="space-y-4">
      {/* File selection */}
      {!selectedFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            Click to select a document
          </p>
          <p className="text-xs text-gray-500">
            PDF, JPEG, PNG, WebP up to {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-200 rounded">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
                {isPDF ? ' - PDF' : ' - Image'}
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Document details */}
      {selectedFile && (
        <div className="space-y-4">
          <Select
            label="Document Type"
            options={documentTypes}
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
          />

          <Input
            label="Document Name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Enter a name for this document"
          />

          <Button
            onClick={handleUpload}
            disabled={isUploading || !docName.trim()}
            loading={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      )}
    </div>
  );
}
