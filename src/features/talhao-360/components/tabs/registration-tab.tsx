import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { saveTalhaoPayload } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoPayload, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { VOCACAO_OPTIONS } from "@/features/talhao-360/types/domain";

const sections: Array<{
  title: string;
  fields: Array<
    [keyof TalhaoPayload, string, "text" | "number" | "date" | "select" | "textarea", string[]?]
  >;
}> = [
  {
    title: "1. Identificação",
    fields: [
      ["talhao", "Nome do talhão", "text"],
      ["codigo", "Código interno", "text"],
      ["fazenda", "Fazenda", "text"],
      ["area_ha", "Área calculada (ha)", "number"],
      ["area_util", "Área útil (ha)", "number"],
      ["responsavel", "Responsável", "text"],
      [
        "status",
        "Status",
        "select",
        ["Plantado", "Em preparo", "Colhido", "Pousio", "Planejado", "Inativo"],
      ],
      ["vocacao", "Vocação", "select", VOCACAO_OPTIONS],
      ["observacoes", "Observações", "textarea"],
    ],
  },
  {
    title: "2. Solo",
    fields: [
      ["tipo_solo", "Tipo predominante", "text"],
      ["textura_solo", "Textura", "text"],
      ["profundidade_efetiva", "Profundidade efetiva", "text"],
      ["drenagem", "Drenagem", "text"],
      ["materia_organica", "Matéria orgânica (%)", "number"],
      ["ph", "pH", "number"],
      ["compactacao", "Compactação", "text"],
      ["erosao", "Erosão", "text"],
      ["ultima_analise_solo", "Última análise", "date"],
    ],
  },
  {
    title: "3. Agronomia",
    fields: [
      ["aptidao_agricola", "Aptidão agrícola", "text"],
      ["cultura_recomendada", "Cultura principal recomendada", "text"],
      ["culturas_alternativas", "Culturas alternativas", "text"],
      ["produtividade_historica", "Produtividade histórica", "number"],
      ["necessidade_calagem", "Necessidade de calagem", "text"],
      ["necessidade_gessagem", "Necessidade de gessagem", "text"],
      ["sensibilidade_estiagem", "Sensibilidade à estiagem", "text"],
      ["sensibilidade_encharcamento", "Sensibilidade ao encharcamento", "text"],
    ],
  },
  {
    title: "4. Infraestrutura",
    fields: [
      ["acesso", "Acesso", "text"],
      ["distancia_sede_km", "Distância da sede (km)", "number"],
      ["irrigacao", "Irrigação", "text"],
      ["energia", "Energia", "text"],
      ["armazenamento_proximo", "Armazenamento próximo", "text"],
      ["pontos_agua", "Pontos de água", "text"],
      ["cercas", "Cercas", "text"],
      ["estradas_internas", "Estradas internas", "text"],
    ],
  },
  {
    title: "5. Classificação estratégica",
    fields: [
      [
        "classificacao_estrategica",
        "Classificação",
        "select",
        ["Estratégico", "Alto potencial", "Problemático", "Em recuperação", "Experimental"],
      ],
    ],
  },
  {
    title: "6. Pecuária",
    fields: [
      ["lote_atual", "Lote/rebanho atual", "text"],
      ["forrageira", "Forrageira", "text"],
      ["lotacao_ua_ha", "Lotação (UA/ha)", "number"],
      ["capacidade_ua", "Capacidade de suporte (UA)", "number"],
      ["dias_descanso", "Dias de descanso", "number"],
    ],
  },
];

export function RegistrationTab({ talhao }: { talhao: TalhaoRecord }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TalhaoPayload>(talhao.payload);
  useEffect(() => setForm(talhao.payload), [talhao]);
  const mutation = useMutation({
    mutationFn: () => saveTalhaoPayload(talhao, form),
    onSuccess: async () => {
      toast.success("Cadastro atualizado.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        A geometria não é alterada nesta aba. Área calculada e GeoJSON permanecem sob controle do
        mapa.
      </div>
      {sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-primary">{section.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {section.fields.map(([key, label, type, options]) => (
              <Field
                key={String(key)}
                label={label}
                type={type}
                options={options}
                value={form[key] ?? ""}
                wide={type === "textarea"}
                disabled={key === "area_ha"}
                onChange={(value) => setForm((current) => ({ ...current, [key]: value }))}
              />
            ))}
          </div>
        </section>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            if (!form.talhao || !form.codigo || !form.area_ha)
              return toast.error("Nome, código e área são obrigatórios.");
            mutation.mutate();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  options,
  value,
  onChange,
  wide,
  disabled,
}: {
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  disabled?: boolean;
}) {
  const className =
    "h-10 rounded-lg border border-border bg-background px-3 text-sm disabled:bg-muted disabled:text-muted-foreground";
  return (
    <label className={`grid gap-1.5 text-sm ${wide ? "sm:col-span-2 xl:col-span-4" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      {type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        >
          <option value="">Selecione</option>
          {options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </label>
  );
}
