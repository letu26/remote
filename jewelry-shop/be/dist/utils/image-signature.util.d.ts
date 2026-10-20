export type ImageKind = 'jpeg' | 'png' | 'webp';
export declare const MIME_BY_KIND: Record<ImageKind, string>;
export declare function detectImageKind(buffer: Buffer): ImageKind | null;
