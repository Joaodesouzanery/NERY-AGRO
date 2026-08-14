import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportModulePdf, exportModuleXlsx, type ModuleWorkbook } from "@/lib/export-module";
import { exportRowsToXlsx } from "@/lib/export-xlsx";

// Exportação de módulo COMPLETO — o que substitui os dois botões que eram
// mentira: o da Logística só dava um toast mandando exportar dentro de cada
// aba, e o do Financeiro dizia "exportação preparada" sem gerar arquivo.

export function ModuleExportButtons({
  workbook,
  currentTabLabel,
}: {
  /**
   * Montado com buildModuleWorkbook a partir do spec da visão geral. Pode ser
   * assíncrono: assim o módulo busca os registros de todas as abas no CLIQUE,
   * em vez de manter tudo carregado só por causa do export.
   */
  workbook: () => ModuleWorkbook | Promise<ModuleWorkbook>;
  /** Nome da aba atual, quando faz sentido exportar só ela. */
  currentTabLabel?: string;
}) {
  const [ocupado, setOcupado] = useState(false);

  const rodar = async (fn: (wb: ModuleWorkbook) => void | Promise<void>, oQue: string) => {
    setOcupado(true);
    try {
      await fn(await workbook());
    } catch (e) {
      toast.error((e as Error).message || `Não foi possível exportar ${oQue}.`);
    } finally {
      setOcupado(false);
    }
  };

  const soAbaAtual = async (wb: ModuleWorkbook) => {
    const aba = wb.sheets.find((s) => s.name === currentTabLabel);
    if (!aba) {
      toast.info("Esta aba não tem registros para exportar.");
      return;
    }
    await exportRowsToXlsx(`${wb.filename}-${aba.name}`, aba.header, aba.rows, aba.name);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={ocupado}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
        >
          {ocupado ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Exportar
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={() => void rodar((wb) => exportModuleXlsx(wb), "o Excel")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span className="flex-1">Excel — módulo completo</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void rodar((wb) => exportModulePdf(wb), "o PDF")}>
          <FileText className="mr-2 h-4 w-4" />
          <span className="flex-1">PDF — módulo completo</span>
        </DropdownMenuItem>
        {currentTabLabel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void rodar(soAbaAtual, "a aba")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="flex-1 truncate">Excel — só “{currentTabLabel}”</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
