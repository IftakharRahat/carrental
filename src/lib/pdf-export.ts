/**
 * Utility for exporting HTML elements to high-quality, professional A4 PDFs.
 * Works seamlessly on all mobile screens and desktop browsers by rendering
 * the document in an isolated 760px desktop staging container before capture.
 *
 * This completely eliminates the issue where mobile viewports constrain the element
 * to ~350px, causing the captured PDF canvas to leave massive blank white margins
 * on the right and bottom of the A4 page.
 */

export type ExportPdfOptions = {
  filename: string;
  targetWidth?: number; // default: 760 (standard A4 printable aspect at 96-100 DPI)
  marginMm?: number; // default: 8mm
  quality?: number; // default: 0.95
};

export async function exportElementToPdf(
  elementOrId: HTMLElement | string,
  options: ExportPdfOptions,
): Promise<void> {
  const element =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error("Element to export as PDF was not found");
  }

  const { toJpeg } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const targetWidth = options.targetWidth ?? 760;
  const marginMm = options.marginMm ?? 8;
  const quality = options.quality ?? 0.95;

  // 1. Create an isolated off-screen staging container with fixed desktop width (760px)
  // Use absolute positioning with top: -99999px so mobile browser viewports (390px) do not constrain it
  const staging = document.createElement("div");
  staging.setAttribute("aria-hidden", "true");
  staging.style.position = "absolute";
  staging.style.left = "0";
  staging.style.top = "-99999px";
  staging.style.width = `${targetWidth}px`;
  staging.style.minWidth = `${targetWidth}px`;
  staging.style.maxWidth = `${targetWidth}px`;
  staging.style.backgroundColor = "#ffffff";
  staging.style.color = "#0f172a";
  staging.style.zIndex = "-99999";
  staging.style.opacity = "0";
  staging.style.pointerEvents = "none";
  staging.style.overflow = "visible";
  staging.style.boxSizing = "border-box";

  // Force light mode theme tokens so dark mode never bleeds into exported PDF
  staging.style.setProperty("--background", "oklch(0.985 0.008 85)");
  staging.style.setProperty("--foreground", "oklch(0.2 0.025 235)");
  staging.style.setProperty("--card", "oklch(1 0 0)");
  staging.style.setProperty("--card-foreground", "oklch(0.2 0.025 235)");
  staging.style.setProperty("--muted", "oklch(0.955 0.01 85)");
  staging.style.setProperty("--muted-foreground", "oklch(0.5 0.025 235)");
  staging.style.setProperty("--border", "oklch(0.922 0 0)");
  staging.style.setProperty("--primary", "oklch(0.42 0.105 166)");
  staging.style.setProperty("--primary-foreground", "oklch(0.985 0 0)");

  // 2. Clone the element deeply so that children layout at the full 760px width
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `${element.id || "document"}-pdf-staging-clone`;
  clone.style.width = `${targetWidth}px`;
  clone.style.minWidth = `${targetWidth}px`;
  clone.style.maxWidth = `${targetWidth}px`;
  clone.style.minHeight = "1060px";
  clone.style.display = "flex";
  clone.style.flexDirection = "column";
  clone.style.justifyContent = "space-between";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.borderRadius = "0";
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";
  clone.style.colorScheme = "light";

  staging.appendChild(clone);
  document.body.appendChild(staging);

  try {
    // Give browser layout engine a moment to recalculate geometry for 760px container
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Measured height of the properly rendered 760px document
    const cloneHeight = Math.max(clone.offsetHeight || 1060, 1060);

    // 3. Convert desktop-sized clone to crisp high-res image
    const dataUrl = await toJpeg(clone, {
      quality,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: targetWidth,
      height: cloneHeight,
      style: {
        width: `${targetWidth}px`,
        minWidth: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        minHeight: `${cloneHeight}px`,
        margin: "0",
        boxShadow: "none",
      },
    });

    // 4. Initialize jsPDF in A4 portrait format
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const printWidth = pdfWidth - marginMm * 2; // 194mm
    const maxHeight = pdfHeight - marginMm * 2; // 281mm

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    let renderWidth = printWidth;
    let renderHeight = (img.height * printWidth) / img.width;

    // If document is taller than printable height, scale down to fit exactly 1 page
    if (renderHeight > maxHeight) {
      renderWidth = (renderWidth * maxHeight) / renderHeight;
      renderHeight = maxHeight;
    }

    const xPos = (pdfWidth - renderWidth) / 2;
    const yPos = Math.max(marginMm, (pdfHeight - renderHeight) / 2);

    pdf.addImage(dataUrl, "JPEG", xPos, yPos, renderWidth, renderHeight, undefined, "FAST");
    pdf.save(options.filename);
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

/**
 * Share an HTML element as a PDF file via the native Web Share API.
 * On mobile (WhatsApp, Telegram, etc.) the PDF is attached as a file.
 * Falls back to downloading the PDF if sharing is not supported.
 */
export async function shareElementAsPdf(
  elementOrId: HTMLElement | string,
  options: ExportPdfOptions,
): Promise<void> {
  const element =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error("Element to share as PDF was not found");
  }

  const { toJpeg } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const targetWidth = options.targetWidth ?? 760;
  const marginMm = options.marginMm ?? 8;
  const quality = options.quality ?? 0.95;

  // 1. Create isolated off-screen staging container at desktop width
  const staging = document.createElement("div");
  staging.setAttribute("aria-hidden", "true");
  staging.style.position = "absolute";
  staging.style.left = "0";
  staging.style.top = "-99999px";
  staging.style.width = `${targetWidth}px`;
  staging.style.minWidth = `${targetWidth}px`;
  staging.style.maxWidth = `${targetWidth}px`;
  staging.style.backgroundColor = "#ffffff";
  staging.style.color = "#0f172a";
  staging.style.zIndex = "-99999";
  staging.style.opacity = "0";
  staging.style.pointerEvents = "none";
  staging.style.overflow = "visible";
  staging.style.boxSizing = "border-box";

  staging.style.setProperty("--background", "oklch(0.985 0.008 85)");
  staging.style.setProperty("--foreground", "oklch(0.2 0.025 235)");
  staging.style.setProperty("--card", "oklch(1 0 0)");
  staging.style.setProperty("--card-foreground", "oklch(0.2 0.025 235)");
  staging.style.setProperty("--muted", "oklch(0.955 0.01 85)");
  staging.style.setProperty("--muted-foreground", "oklch(0.5 0.025 235)");
  staging.style.setProperty("--border", "oklch(0.922 0 0)");
  staging.style.setProperty("--primary", "oklch(0.42 0.105 166)");
  staging.style.setProperty("--primary-foreground", "oklch(0.985 0 0)");

  // 2. Clone element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `${element.id || "document"}-pdf-share-clone`;
  clone.style.width = `${targetWidth}px`;
  clone.style.minWidth = `${targetWidth}px`;
  clone.style.maxWidth = `${targetWidth}px`;
  clone.style.minHeight = "1060px";
  clone.style.display = "flex";
  clone.style.flexDirection = "column";
  clone.style.justifyContent = "space-between";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.borderRadius = "0";
  clone.style.boxSizing = "border-box";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";
  clone.style.colorScheme = "light";

  staging.appendChild(clone);
  document.body.appendChild(staging);

  try {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const cloneHeight = Math.max(clone.offsetHeight || 1060, 1060);

    const dataUrl = await toJpeg(clone, {
      quality,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: targetWidth,
      height: cloneHeight,
      style: {
        width: `${targetWidth}px`,
        minWidth: `${targetWidth}px`,
        maxWidth: `${targetWidth}px`,
        minHeight: `${cloneHeight}px`,
        margin: "0",
        boxShadow: "none",
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const printWidth = pdfWidth - marginMm * 2;
    const maxHeight = pdfHeight - marginMm * 2;

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    let renderWidth = printWidth;
    let renderHeight = (img.height * printWidth) / img.width;

    if (renderHeight > maxHeight) {
      renderWidth = (renderWidth * maxHeight) / renderHeight;
      renderHeight = maxHeight;
    }

    const xPos = (pdfWidth - renderWidth) / 2;
    const yPos = Math.max(marginMm, (pdfHeight - renderHeight) / 2);

    pdf.addImage(dataUrl, "JPEG", xPos, yPos, renderWidth, renderHeight, undefined, "FAST");

    // 3. Convert to Blob for sharing
    const pdfBlob = pdf.output("blob");
    const pdfFile = new File([pdfBlob], options.filename, { type: "application/pdf" });

    // 4. Try native Web Share API (works on mobile with WhatsApp, Telegram, etc.)
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      navigator.canShare?.({ files: [pdfFile] })
    ) {
      await navigator.share({
        title: options.filename.replace(/\.pdf$/i, "").replace(/_/g, " "),
        files: [pdfFile],
      });
    } else {
      // Fallback: download the file if Web Share is not supported (desktop browsers)
      pdf.save(options.filename);
    }
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}
