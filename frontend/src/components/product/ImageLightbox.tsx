import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import React, { useState } from "react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  productName,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 50, y: 50 });
  const isZoomed = zoomLevel > 1;

  // Reset zoom on index change
  const handleIndexChange = (newIndex: number) => {
    setZoomLevel(1);
    setPanPosition({ x: 50, y: 50 });
    setCurrentIndex(newIndex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPanPosition({ x, y });
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 2.2 : 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[95vw] sm:max-w-5xl h-[85vh] p-0 bg-background/95 backdrop-blur-2xl border border-border rounded-2xl overflow-hidden flex flex-col focus:outline-none"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
              {productName}
            </span>
            <span className="text-xs text-muted-foreground">
              ({currentIndex + 1} / {images.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleZoom}
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              {isZoomed ? (
                <ZoomOut className="size-4" />
              ) : (
                <ZoomIn className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lightbox"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden bg-card/40 cursor-zoom-in"
          onClick={toggleZoom}
          onMouseMove={handleMouseMove}
        >
          {images.length > 0 && (
            <div
              className="w-full h-full flex items-center justify-center p-4 transition-transform duration-100 ease-out select-none"
              style={{
                transform: isZoomed ? `scale(${zoomLevel})` : "scale(1)",
                transformOrigin: `${panPosition.x}% ${panPosition.y}%`,
                cursor: isZoomed ? "move" : "zoom-in",
              }}
            >
              <img
                src={images[currentIndex]}
                alt={`${productName} view ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndexChange(
                    (currentIndex - 1 + images.length) % images.length,
                  );
                }}
                className="absolute left-4 p-3 rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg border border-border/50 transition-all cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndexChange((currentIndex + 1) % images.length);
                }}
                className="absolute right-4 p-3 rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg border border-border/50 transition-all cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-border/50 bg-background/50 overflow-x-auto shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleIndexChange(idx)}
                className={`size-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                  currentIndex === idx
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-border/60 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
