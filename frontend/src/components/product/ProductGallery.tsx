import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  hasDiscount?: boolean;
}

export default function ProductGallery({
  images,
  productName,
  hasDiscount,
}: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mobileIdx, setMobileIdx] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedIdx(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/25 aspect-square flex items-center justify-center text-muted-foreground text-sm">
        No product image available
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:flex flex-col gap-4">
        {images.map((src, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            className="group rounded-2xl overflow-hidden border border-border bg-card/30 aspect-square relative cursor-pointer flex items-center justify-center p-6"
          >
            <img
              src={src}
              alt={`${productName} — view ${index + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 select-none"
              loading={index === 0 ? "eager" : "lazy"}
            />

            {index === 0 && hasDiscount && (
              <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">
                Sale
              </Badge>
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs font-semibold text-foreground shadow-sm">
                <ZoomIn className="size-3.5" /> Click to zoom
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden flex flex-col gap-3">
        <div
          onClick={() => openLightbox(mobileIdx)}
          className="rounded-2xl overflow-hidden border border-border bg-card/25 aspect-square relative cursor-pointer flex items-center justify-center p-6"
        >
          <img
            src={images[mobileIdx]}
            alt={`${productName} — view ${mobileIdx + 1}`}
            className="max-w-full max-h-full object-contain select-none"
          />

          {hasDiscount && (
            <Badge className="absolute top-4 left-4 bg-red-500">Sale</Badge>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileIdx(
                    (prev) => (prev - 1 + images.length) % images.length,
                  );
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 backdrop-blur-xs border border-border text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileIdx((prev) => (prev + 1) % images.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/70 backdrop-blur-xs border border-border text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMobileIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  mobileIdx === i
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        images={images}
        initialIndex={selectedIdx}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        productName={productName}
      />
    </>
  );
}
