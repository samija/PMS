import { FileText, Download, Trash2, Eye, Image } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export interface Document {
  _id: string;
  url: string;
  type: 'agreement' | 'national_id' | 'passport' | 'other';
  name: string;
  uploadedAt: string;
}

interface DocumentListProps {
  documents: Document[];
  onView: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  isDeleting?: boolean;
  deletingId?: string | null;
}

const typeLabels: Record<string, string> = {
  agreement: 'Agreement',
  national_id: 'National ID',
  passport: 'Passport',
  other: 'Other',
};

const typeVariants: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  agreement: 'info',
  national_id: 'success',
  passport: 'warning',
  other: 'default',
};

export default function DocumentList({
  documents,
  onView,
  onDelete,
  isDeleting = false,
  deletingId = null,
}: DocumentListProps) {
  const isPDF = (url: string) => url.toLowerCase().includes('.pdf') || url.includes('/raw/');

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="py-4 flex items-center gap-4 hover:bg-gray-50 -mx-4 px-4 transition-colors"
        >
          {/* Icon */}
          <div className={`p-2 rounded ${isPDF(doc.url) ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isPDF(doc.url) ? (
              <FileText className="h-6 w-6 text-red-600" />
            ) : (
              <Image className="h-6 w-6 text-blue-600" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={typeVariants[doc.type] || 'default'}>
                {typeLabels[doc.type] || doc.type}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(doc)}
              title="View document"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(doc)}
              title="Download document"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this document?')) {
                    onDelete(doc._id);
                  }
                }}
                disabled={isDeleting && deletingId === doc._id}
                loading={isDeleting && deletingId === doc._id}
                title="Delete document"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
