import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { saveTalhaoPayload } from "@/features/talhao-360/api/services";
import { talhao360Keys } from "@/features/talhao-360/api/query-keys";
import type { TalhaoPayload, TalhaoRecord } from "@/features/talhao-360/types/domain";
import { registrationSections as sections } from "@/features/talhao-360/lib/registration-fields";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RegistrationTab({ talhao, demoMode }: { talhao: TalhaoRecord; demoMode: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TalhaoPayload>(talhao.payload);
  const [step, setStep] = useState(0);
  useEffect(() => setForm(talhao.payload), [talhao]);
  const mutation = useMutation({
    mutationFn: () => saveTalhaoPayload(talhao, form),
    onSuccess: async () => {
      toast.success("Cadastro atualizado.");
      await queryClient.invalidateQueries({ queryKey: talhao360Keys.root });
    },
    onError: (error) => toast.error(error.message),
  });

  const sectionComplete = (index: number) =>
    sections[index].fields.every(([key]) => String(form[key] ?? "").trim() !== "");
  const completas = sections.filter((_, index) => sectionComplete(index)).length;
  const pct = Math.round((completas / sections.length) * 100);
  const section = sections[step];
  const ultima = step === sections.length - 1;

  const salvar = (avancar: boolean) => {
    if (demoMode) return toast.info("Desative o modo DEMO para salvar alterações.");
    if (!form.talhao || !form.codigo || !form.area_ha)
      return toast.error("Nome, código e área são obrigatórios.");
    mutation.mutate(undefined, {
      onSuccess: () => {
        if (avancar && !ultima) setStep((s) => s + 1);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Preenchimento do cadastro</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {completas} de {sections.length} seções · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-success transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-1 grid items-stretch gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          {sections.map((item, index) => {
            const completa = sectionComplete(index);
            const ativa = index === step;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-md border border-border bg-card px-3 text-left text-sm font-medium transition-colors",
                  ativa ? "border-foreground bg-accent" : "hover:bg-accent/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold",
                    completa && "bg-success/20 text-success",
                  )}
                >
                  {completa ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {item.title}
              </button>
            );
          })}
          <div className="mt-auto">
            <div className="my-3 h-px bg-border" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Área e geometria vêm do mapa — campos derivados ficam somente leitura.
            </p>
          </div>
        </div>

        <section className="rounded-md border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.01em]">
                {step + 1}. {section.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{section.desc}</p>
            </div>
            <StatusPill tone={sectionComplete(step) ? "success" : "warning"}>
              {sectionComplete(step) ? "completa" : "em aberto"}
            </StatusPill>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

          <div className="mb-3.5 mt-[18px] h-px bg-border" />
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-muted-foreground">Área calculada</span>
            <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold tabular-nums">
              {form.area_ha ? `${form.area_ha} ha` : "—"} · somente leitura (mapa)
            </span>
            <span className="flex-1" />
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Seção anterior
            </Button>
            <Button disabled={mutation.isPending} onClick={() => salvar(true)}>
              {ultima ? "Salvar alterações" : "Salvar e continuar"}
            </Button>
          </div>
        </section>
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
    "h-9 rounded-md border border-input bg-transparent px-3 text-sm disabled:border-border disabled:bg-muted disabled:text-muted-foreground";
  return (
    <label
      className={`grid gap-2 text-sm font-medium ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}
    >
      {label}
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
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal"
        />
      ) : (
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, "font-normal")}
        />
      )}
    </label>
  );
}
