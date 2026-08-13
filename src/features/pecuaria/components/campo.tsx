import { Label } from "@/components/ui/label";

/** Rótulo + controle de formulário — helper compartilhado dos painéis da Pecuária. */
export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
