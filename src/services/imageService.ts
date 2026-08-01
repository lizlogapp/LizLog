import { Image } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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
  // Storage Rules require the uploaded JPEG to be strictly smaller than 2 MB.
  displayMaxBytes: 2 * 1024 * 1024,
} as const;

export type ImageVariants = {
  displayUri: string;
  thumbnailUri: string;
  displayBytes: number;
  thumbnailBytes: number;
};

export type ImagePipelineStage =
  | 'process'
  | 'read'
  | 'auth'
  | 'quota'
  | 'upload-main'
  | 'upload-thumbnail'
  | 'writeback';

export type ImagePipelinePhase = 'start' | 'finalize' | 'writeback';

export type ImageFailureClassification =
  | 'app-check'
  | 'authentication'
  | 'security-rules'
  | 'network'
  | 'protocol'
  | 'file'
  | 'image-processing'
  | 'quota'
  | 'writeback'
  | 'cleanup'
  | 'unknown';

type ImagePipelineErrorOptions = {
  cause?: unknown;
  phase?: ImagePipelinePhase;
  httpStatus?: number;
  classification?: ImageFailureClassification;
};

function classifyImagePipelineFailure(
  stage: ImagePipelineStage,
  code: string,
): ImageFailureClassification {
  if (code === 'storage/unauthorized-app') return 'app-check';
  if (code === 'storage/unauthenticated' || code.startsWith('auth/')) return 'authentication';
  if (code === 'storage/unauthorized' || code === 'permission-denied') return 'security-rules';
  if (
    code === 'storage/network-request-failed'
    || code === 'storage/retry-limit-exceeded'
    || code === 'unavailable'
    || code === 'deadline-exceeded'
  ) {
    return 'network';
  }
  if (stage === 'read') return 'file';
  if (stage === 'process') return 'image-processing';
  if (stage === 'quota') return 'quota';
  if (stage === 'writeback') return 'writeback';
  return 'unknown';
}

export class ImagePipelineError extends Error {
  public readonly phase?: ImagePipelinePhase;
  public readonly httpStatus?: number;
  public readonly classification: ImageFailureClassification;

  constructor(
    public readonly stage: ImagePipelineStage,
    message: string,
    public readonly code = 'unknown',
    options?: ImagePipelineErrorOptions,
  ) {
    super(message, options);
    this.name = 'ImagePipelineError';
    this.phase = options?.phase ?? (stage === 'writeback' ? 'writeback' : undefined);
    this.httpStatus = options?.httpStatus;
    this.classification = options?.classification ?? classifyImagePipelineFailure(stage, code);
  }
}

export function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code || 'unknown');
  }
  return 'unknown';
}

export function logImagePipelineError(error: unknown): void {
  const stage = error instanceof ImagePipelineError ? error.stage : 'unknown';
  const phase = error instanceof ImagePipelineError ? error.phase : undefined;
  const httpStatus = error instanceof ImagePipelineError ? error.httpStatus : undefined;
  const classification = error instanceof ImagePipelineError
    ? error.classification
    : 'unknown';
  // 僅輸出安全分類；不可輸出 token、完整 URL、response body 或檔案內容。
  console.warn('Image pipeline failed:', {
    stage,
    phase,
    httpStatus,
    classification,
    code: errorCode(error),
  });
}

export function imagePipelineDiagnostic(error: unknown): string {
  const stage = error instanceof ImagePipelineError ? error.stage : 'unknown';
  const code = errorCode(error).replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 80) || 'unknown';
  const phase = error instanceof ImagePipelineError ? error.phase : undefined;
  const httpStatus = error instanceof ImagePipelineError
    && Number.isInteger(error.httpStatus)
    && error.httpStatus! >= 100
    && error.httpStatus! <= 599
    ? `http-${error.httpStatus}`
    : undefined;
  const classification = error instanceof ImagePipelineError
    ? error.classification
    : 'unknown';
  return [stage, phase, httpStatus, classification, code].filter(Boolean).join('/');
}

export function imagePipelineMessage(error: unknown): string {
  if (!(error instanceof ImagePipelineError)) {
    return '照片處理失敗，請確認網路後再試一次。';
  }
  switch (error.stage) {
    case 'process':
      return error.message || '照片處理失敗，請改用 JPEG 圖片後重試。';
    case 'read':
      return '無法讀取照片檔案，請重新選擇照片。';
    case 'auth':
      return '登入驗證已失效，請重新登入後再試。';
    case 'quota':
      return error.message || '今日照片上傳次數已達上限。';
    case 'upload-main':
    case 'upload-thumbnail':
      if (error.code === 'storage/unauthenticated') {
        return '登入驗證已失效，請重新登入後再試。';
      }
      if (error.code === 'storage/unauthorized-app') {
        return '此版本未通過照片服務驗證，請更新 APP 後再試。';
      }
      if (error.code === 'storage/unauthorized') {
        return '照片上傳權限設定異常，請稍後再試。';
      }
      if (error.code === 'storage/retry-limit-exceeded') {
        return '網路連線不穩定，請恢復網路後再試。';
      }
      return '照片上傳失敗，請確認網路後再試一次。';
    case 'writeback':
      return '照片已處理，但無法更新資料，請稍後重試。';
    default:
      return '照片處理失敗，請稍後重試。';
  }
}

export async function readLocalBytes(uri: string): Promise<Uint8Array<ArrayBuffer>> {
  try {
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('file-not-found');
    }
    const bytes = await file.bytes();
    if (bytes.byteLength === 0) {
      throw new Error('empty-file');
    }
    return bytes as Uint8Array<ArrayBuffer>;
  } catch (error) {
    if (error instanceof ImagePipelineError) throw error;
    throw new ImagePipelineError('read', '無法讀取照片檔案。', errorCode(error), { cause: error });
  }
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
  const file = new File(uri);
  if (!file.exists) {
    throw new ImagePipelineError('read', '無法讀取照片檔案。', 'file-not-found');
  }
  if (file.size > 0) return file.size;
  return (await readLocalBytes(uri)).byteLength;
}

export async function validateImageSourceSize(uri: string, knownBytes?: number | null): Promise<void> {
  const bytes = knownBytes ?? await fileSize(uri);
  if (bytes > IMAGE_POLICY.sourceMaxBytes) {
    throw new ImagePipelineError('process', '原始照片不可超過 5MB。', 'image/source-too-large');
  }
}

/** Creates the JPEG display image and thumbnail exactly once for each save attempt. */
export async function createImageVariants(uri: string): Promise<ImageVariants> {
  try {
    const { width, height } = await getImageSize(uri);
    let display = await manipulateAsync(
      uri,
      resizeAction(width, height, IMAGE_POLICY.displayMaxEdge),
      { compress: IMAGE_POLICY.displayQuality, format: SaveFormat.JPEG },
    );
    let displayBytes = await fileSize(display.uri);

    const fallbackProfiles = [
      { maxEdge: 1600, quality: 0.6 },
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
      throw new ImagePipelineError(
        'process',
        '照片壓縮後仍超過 2MB，請改用較小的照片。',
        'image/display-too-large',
      );
    }

    const thumbnail = await manipulateAsync(
      display.uri,
      resizeAction(display.width, display.height, IMAGE_POLICY.thumbnailMaxEdge),
      { compress: IMAGE_POLICY.thumbnailQuality, format: SaveFormat.JPEG },
    );
    const thumbnailBytes = await fileSize(thumbnail.uri);

    return {
      displayUri: display.uri,
      thumbnailUri: thumbnail.uri,
      displayBytes,
      thumbnailBytes,
    };
  } catch (error) {
    if (error instanceof ImagePipelineError) throw error;
    throw new ImagePipelineError('process', '照片處理失敗，請重新選擇照片。', errorCode(error), {
      cause: error,
    });
  }
}

/** 將遠端日記照片下載到暫存區，再寫入手機相簿。 */
export async function saveRemoteImageToLibrary(url: string): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) {
    throw new Error('請允許蜥日日記儲存照片，才能下載圖片。');
  }

  const destination = new File(Paths.cache, `lizlog-diary-${Date.now()}.jpg`);
  if (destination.exists) destination.delete();
  const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });
  try {
    await MediaLibrary.saveToLibraryAsync(downloaded.uri);
  } finally {
    if (downloaded.exists) downloaded.delete();
  }
}
