declare module "heic-convert" {
  type HeicConvertOptions = {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  export default function heicConvert(options: HeicConvertOptions): Promise<Buffer>;
}

declare module "heic-convert/browser" {
  export default function heicConvert(options: {
    buffer: Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<Uint8Array<ArrayBuffer>>;
}
