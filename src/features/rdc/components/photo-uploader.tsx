import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { invalidateConnectedQueries } from "@/lib/connected-agro-data";
import { rdcKeys } from "@/features/rdc/api/query-keys";
import { deletePhoto, getSignedPhotoUrl, uploadRdcPhoto } from "@/features/rdc/api/services";
import type { RdcPhoto } from "@/features/rdc/types/domain";
import { useAuth } from "@/hooks/use-auth";

const MAX_BYTES = 8 * 1024 * 1024;

export function RdcPhotoSection({
  rdcId,
  photos,
  demoMode,
}: {
  rdcId: string;
  photos: RdcPhoto[];
  demoMode: boolean;
}) {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: rdcKeys.root });
    invalidateConnectedQueries(queryClient);
  };

  const deleteM = useMutation({
    mutationFn: (photo: RdcPhoto) => deletePhoto(photo),
    onSuccess: () => {
      toast.success("Foto removida.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (demoMode) {
      toast.info("Desligue o modo DEMO para enviar fotos reais.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(
        "Storage do Supabase não configurado. Configure as variáveis e o bucket rdc-photos.",
      );
      return;
    }
    if (!orgId) {
      toast.error("Sua conta ainda não está vinculada a uma empresa.");
      return;
    }
    setUploading(true);
    let sent = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: não é uma imagem.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: maior que 8 MB.`);
          continue;
        }
        await uploadRdcPhoto({ orgId, rdcId, secao: "observacoes", file });
        sent += 1;
      }
      if (sent) {
        toast.success(sent === 1 ? "Foto enviada." : `${sent} fotos enviadas.`);
        invalidate();
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Camera className="h-4 w-4 text-primary" />
            Fotos do dia
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro visual do campo (JPG/PNG, até 8 MB).
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Enviando…" : "Adicionar fotos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </header>

      <div className="p-4">
        {photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-muted"
              >
                <RdcPhotoThumb photo={photo} alt={photo.legenda ?? "Foto do RDC"} />
                <button
                  type="button"
                  onClick={() => {
                    if (demoMode) return toast.info("Fotos demo não podem ser removidas.");
                    if (confirm("Remover esta foto?")) deleteM.mutate(photo);
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-destructive opacity-0 transition group-hover:opacity-100"
                  aria-label="Remover foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {photo.legenda && (
                  <figcaption className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                    {photo.legenda}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma foto ainda. Use “Adicionar fotos” para registrar o campo.
          </p>
        )}
      </div>
    </div>
  );
}

// Resolve a URL de exibição: demo usa a URL mock; real busca uma URL assinada
// (bucket privado) a partir do storage_path.
function RdcPhotoThumb({ photo, alt }: { photo: RdcPhoto; alt: string }) {
  const { data: src } = useQuery({
    queryKey: ["rdc-photo-url", photo.storagePath, photo.url],
    queryFn: async () => (photo.url ? photo.url : await getSignedPhotoUrl(photo.storagePath)),
    enabled: Boolean(photo.url || photo.storagePath),
    staleTime: 50 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  if (!src) {
    return <div className="aspect-[4/3] w-full animate-pulse bg-muted" />;
  }
  return <img src={src} alt={alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />;
}
