"use client";

const maxSourceFileSize = 20 * 1024 * 1024;
const targetBytes = 900 * 1024;
const maxDimension = 1600;

function getFileExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  const dotIndex = lowerName.lastIndexOf(".");
  return dotIndex >= 0 ? lowerName.slice(dotIndex) : "";
}

export function isHeicFile(file: File) {
  const extension = getFileExtension(file.name);
  return extension === ".heic" || extension === ".heif" || file.type === "image/heic" || file.type === "image/heif";
}

export function validateSourceImage(file: File) {
  if (file.size > maxSourceFileSize) {
    return {
      ok: false as const,
      message: "画像が大きすぎます。20MB以下の画像でお試しください。"
    };
  }

  return { ok: true as const };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = dataUrl;
  });
}

function dataUrlByteLength(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

async function compressDataUrl(dataUrl: string) {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let compressed = canvas.toDataURL("image/jpeg", quality);

  while (dataUrlByteLength(compressed) > targetBytes && quality > 0.42) {
    quality -= 0.08;
    compressed = canvas.toDataURL("image/jpeg", quality);
  }

  return compressed;
}

async function convertHeicToJpeg(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/convert-heic", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("HEIC conversion failed");
  }

  return (await response.json()) as {
    dataUrl: string;
    fileName: string;
  };
}

export async function prepareImageForStorage(file: File) {
  const validation = validateSourceImage(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  if (isHeicFile(file)) {
    const converted = await convertHeicToJpeg(file);
    const compressedDataUrl = await compressDataUrl(converted.dataUrl);

    return {
      dataUrl: compressedDataUrl,
      fileName: converted.fileName,
      message: "HEIC画像を軽くしてセットしました。"
    };
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const compressedDataUrl = await compressDataUrl(originalDataUrl);

  return {
    dataUrl: compressedDataUrl,
    fileName: file.name,
    message:
      dataUrlByteLength(compressedDataUrl) < dataUrlByteLength(originalDataUrl)
        ? "画像を軽くしてセットしました。"
        : "画像をセットしました。"
  };
}
