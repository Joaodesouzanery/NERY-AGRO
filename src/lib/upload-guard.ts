// Regras de upload de arquivo, num lugar só.
//
// Existiam duas cópias divergentes: a Remessa validava tipo e tamanho no
// serviço, o RDC só na tela — e as duas sanitizavam o nome com regex
// diferentes (`[^a-zA-Z0-9._-]` e `[^\w.-]`). Divergência assim não fica
// parada: cada caminho novo copia a versão que estiver mais à mão, e o teto de
// 8 MB que a interface promete deixa de valer em algum deles.
//
// Isto NÃO substitui os limites do bucket (`file_size_limit` e
// `allowed_mime_types`, aplicados na migração 20260811120000). São camadas
// diferentes: aqui a mensagem é em português e chega antes de gastar a rede;
// lá é o que vale contra quem chama a API do Storage direto, sem passar por
// esta tela.

/** 8 MB — o mesmo teto declarado no bucket. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Nome seguro para o Storage: sem barra, sem espaço, sem acento. */
export function nomeSeguroDeArquivo(nome: string): string {
  return nome.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

/**
 * Valida antes de subir. Lança com mensagem para o usuário — quem chama já
 * mostra o erro num toast.
 */
export function assertImagemValida(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem (JPG/PNG). Este arquivo não é uma imagem.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Imagem maior que 8 MB. Reduza o tamanho e tente novamente.");
  }
}
