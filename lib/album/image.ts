import { prepareImageForStorage } from "@/lib/image-client";

function imageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("写真を読み込めませんでした。"));
    image.src = dataUrl;
  });
}

function jpegFile(dataUrl: string, name: string) {
  const bytes = window.atob(dataUrl.split(",")[1] ?? "");
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new File([array], name, { type: "image/jpeg" });
}

export async function prepareAlbumPhoto(file: File) {
  const prepared = await prepareImageForStorage(file);
  const image = await imageFromDataUrl(prepared.dataUrl);
  const scale = Math.min(1, 360 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("写真の縮小に失敗しました。");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    photo: jpegFile(prepared.dataUrl, "album-photo.jpg"),
    thumbnail: jpegFile(canvas.toDataURL("image/jpeg", 0.7), "album-thumbnail.jpg")
  };
}
