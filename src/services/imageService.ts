import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const IMAGE_POLICY = {
  dailyUploadLimit: 30,
  diaryImageLimit: 10,
  medicalImageLimit: 10,
  displayMaxEdge: 2048,
  thumbnailMaxEdge: 480,
  displayQuality: 0.78,
  thumbnailQuality: 0.65,
  sourceMaxBytes: 5 * 1024 * 1024,
  displayMaxBytes: 2 * 1024 * 1024,
} as const;

export type ImageVariants = {
  displayUri: string;
  thumbnailUri: string;
};

type ClosableBlob = Blob & { close?: () => void };

/**
 * React Native Android 無法保證 fetch 能讀取 file:// 或 content:// URI。
 * 使用原生 XMLHttpRequest 取得 Blob，供圖片大小檢查與 Firebase Storage 共用。
 */
export function readLocalBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.timeout = 30_000;
    xhr.onload = () => {
      const blob = xhr.response as Blob | null;
      if (!blob || blob.size === 0) {
        reject(new Error('無法讀取選取的檔案'));
        return;
      }
      resolve(blob);
    };
    xhr.onerror = () => reject(new Error('無法讀取選取的檔案'));
    xhr.onabort = () => reject(new Error('圖片讀取已取消'));
    xhr.ontimeout = () => reject(new Error('讀取圖片逾時，請重新選擇'));
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/** React Native Blob 會持有原生資源；使用完畢後主動釋放。 */
export function closeLocalBlob(blob: Blob): void {
  (blob as ClosableBlob).close?.();
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function resizeAction(width: number, height: number, maxEdge: number) {
  if (Math.max(width, height) <= maxEdge) return [];
  return width >= height
    ? [{ resize: { width: maxEdge } }]
    : [{ resize: { height: maxEdge } }];
}

async function fileSize(uri: string): Promise<number> {
  const blob = await readLocalBlob(uri);
  try {
    return blob.size;
  } finally {
    closeLocalBlob(blob);
  }
}

export async function validateImageSourceSize(uri: string, knownBytes?: number | null): Promise<void> {
  const bytes = knownBytes ?? await fileSize(uri);
  if (bytes > IMAGE_POLICY.sourceMaxBytes) {
    throw new Error('單張圖片檔案大小上限 5MB');
  }
}

/** 上傳前產生壓縮顯示圖與列表縮圖，不保留裝置原始大圖。 */
export async function createImageVariants(uri: string): Promise<ImageVariants> {
  const { width, height } = await getImageSize(uri);
  let display = await manipulateAsync(
    uri,
    resizeAction(width, height, IMAGE_POLICY.displayMaxEdge),
    { compress: IMAGE_POLICY.displayQuality, format: SaveFormat.JPEG },
  );

  let displayBytes = await fileSize(display.uri);
  if (displayBytes > IMAGE_POLICY.sourceMaxBytes) {
    display = await manipulateAsync(
      uri,
      resizeAction(width, height, 1600),
      { compress: 0.6, format: SaveFormat.JPEG },
    );
    displayBytes = await fileSize(display.uri);
  }
  if (displayBytes > IMAGE_POLICY.sourceMaxBytes) {
    throw new Error('圖片強制壓縮後仍大於 5MB，檔案過大無法上傳');
  }

  // Storage Rules 要求主圖嚴格小於 2MB；逐步降低尺寸與品質，
  // 這是傳輸層限制，不應在選圖前以原檔大小拒絕使用者。
  const fallbackProfiles = [
    { maxEdge: 1280, quality: 0.52 },
    { maxEdge: 1024, quality: 0.46 },
    { maxEdge: 800, quality: 0.4 },
  ];
  for (const profile of fallbackProfiles) {
    if (displayBytes < IMAGE_POLICY.displayMaxBytes) break;
    display = await manipulateAsync(
      uri,
      resizeAction(width, height, profile.maxEdge),
      { compress: profile.quality, format: SaveFormat.JPEG },
    );
    displayBytes = await fileSize(display.uri);
  }

  if (displayBytes >= IMAGE_POLICY.displayMaxBytes) {
    throw new Error('圖片無法完成壓縮，請改選其他圖片');
  }

  const thumbnail = await manipulateAsync(
    display.uri,
    resizeAction(display.width, display.height, IMAGE_POLICY.thumbnailMaxEdge),
    { compress: IMAGE_POLICY.thumbnailQuality, format: SaveFormat.JPEG },
  );

  return { displayUri: display.uri, thumbnailUri: thumbnail.uri };
}
