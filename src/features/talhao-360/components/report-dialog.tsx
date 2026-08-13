import type { Talhao360Model } from "@/features/talhao-360/types/domain";
import { ReportsTab } from "@/features/talhao-360/components/tabs/reports-tab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Geração de relatório saiu das abas: o conteúdo (modelos + prévia + PDF)
// vive num dialog aberto pelo botão "Gerar relatório" do header.
export function ReportDialog({
  model,
  open,
  onOpenChange,
}: {
  model: Talhao360Model;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerar relatório</DialogTitle>
          <DialogDescription>
            Escolha um modelo, confira a prévia e baixe o PDF do talhão.
          </DialogDescription>
        </DialogHeader>
        <ReportsTab model={model} />
      </DialogContent>
    </Dialog>
  );
}
