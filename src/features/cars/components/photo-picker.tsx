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
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const additions = Array.from(selected);
    const invalid = additions.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_BYTES,
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
        className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        <ImagePlus className="size-6 text-primary" />
        <span className="font-medium text-foreground">Add vehicle photos</span>
        <span>JPEG, PNG or WebP · 5 MB each · up to 8</span>
      </button>

      {message && <p className="text-sm text-destructive">{message}</p>}

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted",
                index === mainIndex && "ring-2 ring-primary ring-offset-2",
              )}
            >
              {previews[index] && (
                <Image
                  src={previews[index]}
                  alt={`Vehicle upload ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
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
