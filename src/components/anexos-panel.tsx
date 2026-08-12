import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteAnexo, getAnexoUrl, listAnexos, uploadAnexo } from "@/lib/anexos";
import { compressImage } from "@/lib/image-utils";
import { useAuth } from "@/hooks/use-auth";
import { useDemoMode } from "@/hooks/use-demo-mode";

// Anexos de um registro — fotos, laudos, comprovantes.
//
// Vive dentro do detalhe do registro, e não como campo do formulário, por uma
// razão prática: o arquivo precisa de um `ref_id`, que só existe depois de o
// registro ser salvo. Como ação sobre um registro existente, isto funciona em
// TODOS os módulos que abrem o detalhe, sem precisar de campo novo em cada um.

export function AnexosPanel({ refId, refModule }: { refId: string; refModule: string }) {
  const { orgId } = useAuth();
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const { data: anexos = [] } = useQuery({
    queryKey: ["anexos", refId],
    queryFn: async () => {
      const lista = await listAnexos(refId);
      return Promise.all(
        lista.map(async (a) => ({
          ...a,
          // Miniatura no tile; o original abre ao clicar. Falha ao assinar vira
          // um item sem imagem, não um sumiço: some do grid faria a pessoa achar
          // que o anexo nunca existiu.
          url: await getAnexoUrl(a.thumbPath || a.path).catch(() => ""),
          urlOriginal: await getAnexoUrl(a.path).catch(() => ""),
        })),
      );
    },
    enabled: Boolean(refId) && !demoMode,
    staleTime: 60_000,
  });

  const remover = useMutation({
    mutationFn: deleteAnexo,
    onSuccess: () => {
      toast.success("Anexo removido.");
      void queryClient.invalidateQueries({ queryKey: ["anexos", refId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anexar = async (files: FileList | null) => {
    if (!files?.length) return;
    if (demoMode) {
      toast.info("Desligue o modo DEMO para anexar arquivos.");
      return;
    }
    if (!orgId) {
      toast.error("Sua conta ainda não está vinculada a uma empresa.");
      return;
    }
    setEnviando(true);
    let falhas = 0;
    for (const file of Array.from(files)) {
      try {
        // Comprime antes de subir: foto de celular vem com 4-8 MB e o teto do
        // bucket é 8 MB — sem isto, metade das fotos seria recusada.
        const otimizado = await compressImage(file);
        await uploadAnexo({ orgId, refId, refModule, file: otimizado });
      } catch (erro) {
        falhas += 1;
        console.warn("[anexo] não subiu:", erro);
      }
    }
    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
    void queryClient.invalidateQueries({ queryKey: ["anexos", refId] });
    if (falhas) toast.warning(`${falhas} arquivo(s) não subiram — tente de novo.`);
    else toast.success("Anexo salvo.");
  };

  return (
    <div className="border-t border-border pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          Anexos {anexos.length > 0 && `(${anexos.length})`}
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium transition hover:bg-accent disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {enviando ? "Enviando..." : "Anexar"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void anexar(e.target.files)}
        />
      </div>

      {anexos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {demoMode
            ? "Anexos aparecem aqui fora do modo DEMO."
            : "Nenhum arquivo anexado a este registro."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {anexos.map((a) => (
            <div key={a.id} className="group relative">
              <a href={a.urlOriginal || undefined} target="_blank" rel="noreferrer">
                {a.url ? (
                  <img
                    src={a.url}
                    alt={a.nome}
                    loading="lazy"
                    className="aspect-square w-full rounded border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
                    não carregou
                  </div>
                )}
              </a>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remover "${a.nome}"?`)) remover.mutate(a);
                }}
                className="absolute right-1 top-1 hidden rounded bg-background/90 p-1 text-destructive group-hover:block"
                aria-label={`Remover ${a.nome}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
