"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PhotoPickerProps = {
  files: readonly File[];
  mainIndex: number;
  onChange: (files: File[], mainIndex: number) => void;
};

export function PhotoPicker({ files, mainIndex, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>();

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const additions = Array.from(selected);
    const invalid = additions.find(
      (file) =>
        !ACCEPTED_TYPES.has(file.type) ||
        file.size < 1 ||
        file.size > MAX_BYTES,
    );
    if (invalid) {
      setMessage("Use JPEG, PNG or WebP images up to 5 MB each.");
      return;
    }
    if (files.length + additions.length > MAX_PHOTOS) {
      setMessage(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setMessage(undefined);
    onChange([...files, ...additions], files.length === 0 ? 0 : mainIndex);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
    let nextMain = mainIndex;
    if (index === mainIndex) nextMain = 0;
    else if (index < mainIndex) nextMain -= 1;
    onChange(nextFiles, nextFiles.length === 0 ? 0 : nextMain);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm transition-colors"
      >
        <ImagePlus className="text-primary size-6" />
        <span className="text-foreground font-medium">Add vehicle photos</span>
        <span>JPEG, PNG or WebP · 5 MB each · up to 8</span>
      </button>

      {message && <p className="text-destructive text-sm">{message}</p>}

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className={cn(
                "group bg-muted relative aspect-[4/3] overflow-hidden rounded-lg border",
                index === mainIndex && "ring-primary ring-2 ring-offset-2",
              )}
            >
              <PhotoPreview file={file} index={index} />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 p-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant={index === mainIndex ? "default" : "secondary"}
                  onClick={() => onChange([...files], index)}
                  aria-label={`Mark ${file.name} as main photo`}
                >
                  <Star className="size-3" />
                  {index === mainIndex ? "Main" : "Set main"}
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="destructive"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoPreview({ file, index }: { file: File; index: number }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <Image
      src={url}
      alt={`Vehicle upload ${index + 1}`}
      fill
      unoptimized
      className="object-cover"
    />
  );
}
