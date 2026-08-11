import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, ImageOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteRemessaPhoto,
  getRemessaPhotoUrl,
  listRemessaPhotos,
  updateRemessaPhotoLegenda,
  type RemessaPhoto,
  type RemessaPhotoSource,
} from "@/features/remessa/api/services";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";

// Galeria das fotos anexadas na ingestão. Resolve signed URLs do bucket privado
// (rdc-photos). `source` separa romaneios de caixas vazias; `refId` mostra só as
// fotos DAQUELA carga (a prova do romaneio, em vez de um mural cronológico).
// Foto que não assina (storage fora, RLS, expirada) NÃO some silenciosamente:
// vira um tile "não carregou" para o usuário perceber (em vez de sumir do grid).
async function loadPhotosWithUrls(
  limit: number,
  filtro: { source?: RemessaPhotoSource; refId?: string },
) {
  const photos = (await listRemessaPhotos({ ...filtro, limit })).slice(0, limit);
  return Promise.all(
    photos.map(async (p) => ({
      ...p,
      // A miniatura de 320px é o que vai no tile; `url` (original) continua
      // sendo o que abre ao clicar. Foto anterior a esta versão não tem thumb —
      // aí o tile recebe o original, como antes.
      url: await getRemessaPhotoUrl(p.path).catch(() => ""),
      thumbUrl: p.thumbPath ? await getRemessaPhotoUrl(p.thumbPath).catch(() => "") : "",
    })),
  );
}

export function RemessaPhotoGallery({
  limit = 12,
  source,
  refId,
  editavel = true,
}: {
  limit?: number;
  source?: RemessaPhotoSource;
  refId?: string;
  editavel?: boolean;
} = {}) {
  const { demoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["remessa-photos", limit, source ?? "todas", refId ?? "todos"],
    queryFn: () => loadPhotosWithUrls(limit, { source, refId }),
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 60_000,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["remessa-photos"] });

  const apagar = useMutation({
    mutationFn: (photo: RemessaPhoto) => deleteRemessaPhoto(photo),
    onSuccess: () => {
      toast.success("Foto removida.");
      void invalidar();
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível remover a foto."),
  });

  const salvarLegenda = useMutation({
    mutationFn: ({ photo, legenda }: { photo: RemessaPhoto; legenda: string }) =>
      updateRemessaPhotoLegenda(photo, legenda),
    onSuccess: () => {
      setEditando(null);
      void invalidar();
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar a legenda."),
  });

  if (demoMode) {
    return <EmptyState title="As fotos aparecem no modo real" icon={ImageIcon} />;
  }
  if (isLoading) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">Carregando fotos...</div>
    );
  }
  const photos = data ?? [];
  if (photos.length === 0) {
    return (
      <EmptyState
        title={refId ? "Esta carga ainda não tem foto anexada" : "Nenhuma foto anexada ainda"}
        icon={ImageIcon}
      />
    );
  }
  const falhas = photos.filter((p) => !p.url).length;

  return (
    <div className="space-y-2">
      {falhas > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <ImageOff className="h-3.5 w-3.5" />
          {falhas} foto(s) não carregaram agora — tente recarregar em instantes.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) =>
          p.url ? (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted"
            >
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer noopener"
                title={p.legenda || "Foto do romaneio"}
              >
                <img
                  src={p.thumbUrl || p.url}
                  alt={p.legenda || "Foto do romaneio"}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:opacity-90"
                />
              </a>

              {editavel && (
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    title="Editar legenda"
                    onClick={() => {
                      setEditando(p.id);
                      setRascunho(p.legenda);
                    }}
                    className="rounded bg-black/60 p-1 text-white transition hover:bg-black/80"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Remover foto"
                    disabled={apagar.isPending}
                    onClick={() => {
                      if (confirm("Remover esta foto? A imagem é apagada do storage.")) {
                        apagar.mutate(p);
                      }
                    }}
                    className="rounded bg-black/60 p-1 text-white transition hover:bg-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}

              {editando === p.id ? (
                <form
                  className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/75 p-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    salvarLegenda.mutate({ photo: p, legenda: rascunho.trim() });
                  }}
                >
                  <input
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    autoFocus
                    placeholder="Legenda"
                    className="h-6 min-w-0 flex-1 rounded bg-white/90 px-1 text-[10px] text-black"
                  />
                  <button
                    type="submit"
                    disabled={salvarLegenda.isPending}
                    className="rounded bg-primary px-1.5 text-[10px] text-primary-foreground disabled:opacity-50"
                  >
                    OK
                  </button>
                </form>
              ) : (
                p.legenda && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                    {p.legenda}
                  </span>
                )
              )}
            </div>
          ) : (
            <div
              key={p.id}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 p-2 text-center text-[10px] text-muted-foreground"
              title="A foto existe mas não carregou agora"
            >
              <ImageOff className="h-4 w-4" />
              não carregou
            </div>
          ),
        )}
      </div>
    </div>
  );
}
