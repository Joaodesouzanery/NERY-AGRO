// Utilitários de imagem client-side (canvas). Rodam SÓ no navegador — não
// importar em código de servidor/SSR. Usados para (a) comprimir a foto do
// romaneio antes do upload e (b) pré-processar a imagem para o OCR.

const isBrowser = () => typeof document !== "undefined" && typeof createImageBitmap === "function";

// Decodifica o arquivo já com a rotação EXIF aplicada (fotos de celular vêm
// "deitadas"); o `imageOrientation: "from-image"` deixa o navegador corrigir.
async function decode(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

// Escala para caber o lado maior em maxDim (nunca amplia).
function targetSize(w: number, h: number, maxDim: number): { w: number; h: number } {
  const maior = Math.max(w, h);
  if (maior <= maxDim) return { w, h };
  const k = maxDim / maior;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/**
 * Comprime/redimensiona uma foto para JPEG. Reduz muito o tamanho de fotos de
 * celular (3–8 MB → algumas centenas de KB) preservando legibilidade. Se algo
 * falhar (navegador antigo, arquivo estranho), devolve o arquivo original —
 * nunca quebra o fluxo de anexo.
 */
export async function compressImage(
  file: File,
  { maxDim = 1600, quality = 0.82 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  if (!isBrowser() || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await decode(file);
    const { w, h } = targetSize(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    // Só troca se realmente ficou menor (evita "comprimir" e crescer).
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/**
 * Pré-processa a imagem para o OCR: escala de cinza + reforço de contraste, num
 * tamanho maior (o Tesseract lê melhor com mais resolução no texto). Devolve um
 * data URL (image/png) pronto para o `recognize`. Cai para o arquivo original
 * (via object URL) se o canvas não estiver disponível.
 */
export async function preprocessForOcr(
  file: File,
  { maxDim = 2000, contrast = 1.35 }: { maxDim?: number; contrast?: number } = {},
): Promise<string> {
  if (!isBrowser()) return URL.createObjectURL(file);
  try {
    const bitmap = await decode(file);
    const { w, h } = targetSize(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return URL.createObjectURL(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // luminância perceptual → cinza
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // contraste em torno do meio (128)
      const c = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
      d[i] = d[i + 1] = d[i + 2] = c;
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return URL.createObjectURL(file);
  }
}
