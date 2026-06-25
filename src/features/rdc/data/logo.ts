// Logo da fazenda para o cabeçalho do PDF do RDC. Guardado como dataURL no
// localStorage (por navegador) — simples, offline, sem depender de storage.
const KEY = "nery-rdc-logo";

export function getRdcLogo(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setRdcLogo(dataUrl: string | null): void {
  if (typeof window === "undefined") return;
  if (dataUrl) window.localStorage.setItem(KEY, dataUrl);
  else window.localStorage.removeItem(KEY);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}
