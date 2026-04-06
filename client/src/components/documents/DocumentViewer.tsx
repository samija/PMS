import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import Button from '../ui/Button';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  name: string;
}

export default function DocumentViewer({
  isOpen,
  onClose,
  url,
  name,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  const isPDF = url.toLowerCase().includes('.pdf') || url.includes('/raw/');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoom(100);
      setRotation(0);
      setLoading(true);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <h3 className="text-white font-medium truncate max-w-[50%]">{name}</h3>
        <div className="flex items-center gap-2">
          {!isPDF && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Zoom out"
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Zoom in"
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-2" />
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isPDF ? (
          <div className="w-full h-full max-w-4xl">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              </div>
            )}
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded-lg bg-white"
              title={name}
              onLoad={() => setLoading(false)}
            />
          </div>
        ) : (
          <div className="overflow-auto max-w-full max-h-full">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              </div>
            )}
            <img
              src={url}
              alt={name}
              className="max-w-none transition-transform"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              onLoad={() => setLoading(false)}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Mobile footer */}
      <div className="sm:hidden p-4 bg-black/50 flex justify-center gap-4">
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="secondary" size="sm" onClick={handleOpenExternal}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open
        </Button>
      </div>
    </div>
  );
}
