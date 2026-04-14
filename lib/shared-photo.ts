type UploadSharedPhotoInput = {
  dataUrl: string;
  fileName: string;
  folder: "records" | "profile";
};

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const binary = window.atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}

export async function uploadSharedPhoto({ dataUrl, fileName, folder }: UploadSharedPhotoInput) {
  const file = dataUrlToFile(dataUrl, fileName);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/photo-upload", {
    method: "POST",
    credentials: "same-origin",
    body: formData
  });

  const payload = (await response.json().catch(() => null)) as { message?: string; url?: string } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.message ?? "写真共有のアップロードに失敗しました。");
  }

  return payload.url;
}
