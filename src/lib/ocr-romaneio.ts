import { preprocessForOcr } from "@/lib/image-utils";

// OCR on-device (Tesseract.js, núcleo WASM). Roda 100% no navegador — a foto NÃO
// sai do dispositivo (sem chave, sem custo, sem origem externa). Os assets do
// Tesseract são auto-hospedados em /tesseract (same-origin, cobertos pela CSP:
// script-src 'self' + worker-src 'self' blob: + 'wasm-unsafe-eval' p/ o WASM).
// Import DINÂMICO → o tesseract.js só entra no bundle quando o OCR é usado.

export type OcrProgress = (pct: number, status?: string) => void;

// oem=1 (LSTM only) → usa os núcleos *-lstm auto-hospedados; diretório em
// corePath deixa o Tesseract escolher a variante (simd/relaxedsimd/base).
async function criarWorker(logger: (m: { status?: string; progress?: number }) => void) {
  const { createWorker } = await import("tesseract.js");
  return createWorker("por", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract",
    logger,
  });
}

/**
 * Lê o texto das fotos de romaneio/apontamento. Devolve o texto cru — que depois
 * passa pelo MESMO parser/conferência do fluxo de colar. Forte em texto impresso;
 * o manuscrito é ajustado na conferência humana.
 *
 * Usa UM worker para todas as fotos: o custo dominante é carregar o modelo `por`
 * (~15 MB), não reconhecer a imagem — abrir um worker por foto multiplica esse
 * custo à toa. O progresso é global (foto i de n).
 */
export async function ocrRomaneioImages(
  files: File[],
  onProgress?: OcrProgress,
): Promise<string[]> {
  if (!files.length) return [];
  let atual = 0;
  const worker = await criarWorker((m) => {
    // Progresso de cada foto vira uma fatia do total.
    const fatia = ((m.progress ?? 0) + atual) / files.length;
    onProgress?.(Math.round(fatia * 100), m.status);
  });
  const textos: string[] = [];
  try {
    for (let i = 0; i < files.length; i += 1) {
      atual = i;
      const image = await preprocessForOcr(files[i]);
      try {
        const result = await worker.recognize(image);
        textos.push(result.data.text ?? "");
      } finally {
        if (image.startsWith("blob:")) URL.revokeObjectURL(image);
      }
    }
    return textos;
  } finally {
    await worker.terminate();
  }
}
