import { preprocessForOcr } from "@/lib/image-utils";

// OCR on-device (Tesseract.js, núcleo WASM). Roda 100% no navegador — a foto NÃO
// sai do dispositivo (sem chave, sem custo, sem origem externa). Os assets do
// Tesseract são auto-hospedados em /tesseract (same-origin, cobertos pela CSP:
// script-src 'self' + worker-src 'self' blob: + 'wasm-unsafe-eval' p/ o WASM).
// Import DINÂMICO → o tesseract.js só entra no bundle quando o OCR é usado.

export type OcrProgress = (pct: number, status?: string) => void;

/**
 * Lê o texto de uma foto de romaneio/apontamento. Devolve o texto cru — que
 * depois passa pelo MESMO parser/conferência do fluxo de colar. Forte em texto
 * impresso; o manuscrito é ajustado na conferência humana.
 */
export async function ocrRomaneioImage(file: File, onProgress?: OcrProgress): Promise<string> {
  const image = await preprocessForOcr(file);
  const { createWorker } = await import("tesseract.js");
  // oem=1 (LSTM only) → usa os núcleos *-lstm auto-hospedados; diretório em
  // corePath deixa o Tesseract escolher a variante (simd/relaxedsimd/base).
  const worker = await createWorker("por", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract",
    logger: (m: { status?: string; progress?: number }) =>
      onProgress?.(Math.round((m.progress ?? 0) * 100), m.status),
  });
  try {
    const result = await worker.recognize(image);
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
  }
}
