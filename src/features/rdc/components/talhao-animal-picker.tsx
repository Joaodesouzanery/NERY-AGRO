import { useLinkOptions } from "@/features/rdc/hooks/use-rdc";

type LinkMode = "talhao" | "animal" | "both" | "none";

export type LinkPatch = {
  talhaoId?: string;
  talhaoNome?: string;
  animalId?: string;
  animalNome?: string;
};

export function TalhaoAnimalPicker({
  link,
  talhaoId,
  animalId,
  onChange,
}: {
  link: LinkMode;
  talhaoId?: string;
  animalId?: string;
  onChange: (patch: LinkPatch) => void;
}) {
  const { talhoes, animals } = useLinkOptions();
  if (link === "none") return null;

  const showTalhao = link === "talhao" || link === "both";
  const showAnimal = link === "animal" || link === "both";

  return (
    <>
      {showTalhao && (
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted-foreground">Talhão (opcional)</span>
          <select
            value={talhaoId ?? ""}
            onChange={(event) => {
              const id = event.target.value;
              const option = talhoes.find((item) => item.id === id);
              onChange({ talhaoId: id || undefined, talhaoNome: option?.nome });
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">— Sem talhão —</option>
            {talhoes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {showAnimal && (
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted-foreground">Animal (opcional)</span>
          <select
            value={animalId ?? ""}
            onChange={(event) => {
              const id = event.target.value;
              const option = animals.find((item) => item.id === id);
              onChange({ animalId: id || undefined, animalNome: option?.nome });
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">— Sem animal —</option>
            {animals.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nome}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
