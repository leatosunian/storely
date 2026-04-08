"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, X, ImagePlus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { IProductImage } from "@/interfaces/IProduct";

interface ProductGalleryProps {
  value: IProductImage[];
  onChange: (images: IProductImage[]) => void;
  maxImages?: number;
}

export function ProductGallery({
  value,
  onChange,
  maxImages = 8,
}: ProductGalleryProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        toast({
          description: `Máximo ${maxImages} imágenes permitidas.`,
          variant: "destructive",
        });
        return;
      }
      const toUpload = fileArray.slice(0, remaining);

      setUploading(true);
      const newImages: IProductImage[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error();
          const data: IProductImage = await res.json();
          newImages.push(data);
        } catch {
          toast({
            description: `Error al subir "${file.name}".`,
            variant: "destructive",
          });
        }
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
      }
      setUploading(false);
    },
    [value, onChange, maxImages, toast]
  );

  const handleRemove = async (index: number) => {
    const image = value[index];
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: image.publicId }),
      });
    } catch {
      // Image might already be gone — continue removing from state
    }
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        upload(e.dataTransfer.files);
      }
    },
    [upload]
  );

  // Reorder via drag
  const handleReorderDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...value];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
    setDragIdx(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`
          relative flex flex-col items-center justify-center gap-2
          rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
          ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"}
        `}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        ) : (
          <>
            <ImagePlus size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Arrastrá imágenes o hacé click para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              {value.length}/{maxImages} imágenes
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Thumbnails grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div
              key={img.publicId}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleReorderDrop(idx)}
              className={`
                group relative aspect-square rounded-md border overflow-hidden bg-muted/30
                ${dragIdx === idx ? "opacity-50" : ""}
                ${idx === 0 ? "ring-2 ring-primary" : ""}
              `}
            >
              <Image
                src={img.url}
                alt={`Imagen ${idx + 1}`}
                fill
                sizes="150px"
                className="object-cover"
              />
              {/* Drag handle */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded bg-black/50 p-0.5">
                  <GripVertical size={14} className="text-white" />
                </div>
              </div>
              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
              >
                <X size={12} />
              </Button>
              {/* "Principal" badge for first image */}
              {idx === 0 && (
                <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
