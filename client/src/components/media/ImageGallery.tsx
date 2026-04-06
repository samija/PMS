import { useState } from 'react';
import { Expand, Star, Trash2 } from 'lucide-react';
import Lightbox from './Lightbox';

interface ImageGalleryProps {
  images: string[];
  onDelete?: (imageUrl: string) => void;
  onSetPrimary?: (imageUrl: string) => void;
  showActions?: boolean;
  columns?: 2 | 3 | 4;
  showLightbox?: boolean;
}

export default function ImageGallery({
  images,
  onDelete,
  onSetPrimary,
  showActions = false,
  columns = 3,
  showLightbox = true,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    if (showLightbox) {
      setCurrentIndex(index);
      setLightboxOpen(true);
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-500">No images yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-gray-100"
          >
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => openLightbox(index)}
              loading="lazy"
            />

            {/* Primary badge */}
            {index === 0 && showActions && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Primary
              </div>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {showLightbox && (
                <button
                  onClick={() => openLightbox(index)}
                  className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                  title="View fullscreen"
                >
                  <Expand className="h-4 w-4 text-gray-700" />
                </button>
              )}

              {showActions && onSetPrimary && index !== 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetPrimary(image);
                  }}
                  className="p-2 bg-yellow-500/90 hover:bg-yellow-500 rounded-full transition-colors"
                  title="Set as primary"
                >
                  <Star className="h-4 w-4 text-white" />
                </button>
              )}

              {showActions && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image);
                  }}
                  className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showLightbox && (
        <Lightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      )}
    </>
  );
}
