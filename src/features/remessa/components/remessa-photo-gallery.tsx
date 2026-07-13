import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { getRemessaPhotoUrl, listRemessaPhotos } from "@/features/remessa/api/services";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";

// Galeria das fotos de romaneio anexadas na ingestão. Resolve signed URLs do
// bucket privado (rdc-photos). Mostra as mais recentes.
async function loadPhotosWithUrls(limit: number) {
  const photos = (await listRemessaPhotos()).slice(0, limit);
  return Promise.all(
    photos.map(async (p) => ({
      ...p,
      url: await getRemessaPhotoUrl(p.path).catch(() => ""),
    })),
  );
}

export function RemessaPhotoGallery({ limit = 12 }: { limit?: number } = {}) {
  const { demoMode } = useDemoMode();
  const { data, isLoading } = useQuery({
    queryKey: ["remessa-photos", limit],
    queryFn: () => loadPhotosWithUrls(limit),
    enabled: !demoMode && isSupabaseConfigured,
    staleTime: 60_000,
  });

  if (demoMode) {
    return <EmptyState title="As fotos aparecem no modo real" icon={ImageIcon} />;
  }
  if (isLoading) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">Carregando fotos...</div>
    );
  }
  const photos = (data ?? []).filter((p) => p.url);
  if (photos.length === 0) {
    return <EmptyState title="Nenhuma foto anexada ainda" icon={ImageIcon} />;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer noopener"
          className="group relative overflow-hidden rounded-lg border border-border bg-muted"
          title={p.legenda || "Foto do romaneio"}
        >
          <img
            src={p.url}
            alt={p.legenda || "Foto do romaneio"}
            loading="lazy"
            className="aspect-square w-full object-cover transition group-hover:opacity-90"
          />
          {p.legenda && (
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
              {p.legenda}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
