import type { AnimalPdfInput } from "@/lib/animal-pdfs";
import { gmdUltimo, idadeMeses, ordenarPesagens, ultimoPeso } from "./derived";
import {
  ORIGEM_LABEL,
  STATUS_LABEL,
  type Origem,
  type PecAnimal,
  type PecEventoSanitario,
  type PecPesagem,
  type StatusAnimal,
} from "../types/domain";

// Monta a ficha do animal (pec_animal) no formato neutro que a biblioteca de
// PDFs consome. Mantém a lib `animal-pdfs` livre do schema da pecuária.

const traco = (v: unknown) => (v === null || v === undefined || v === "" ? "-" : String(v));

export function fichaAnimalPdf({
  animal,
  loteNome,
  pesagens,
  sanitarios,
  brincoById,
}: {
  animal: PecAnimal;
  loteNome: string | null;
  pesagens: PecPesagem[];
  sanitarios: PecEventoSanitario[];
  brincoById: Map<string, string>;
}): AnimalPdfInput {
  const identificador = animal.brinco_visual ?? animal.sisbov ?? animal.id.slice(0, 8);
  const peso = ultimoPeso(pesagens);
  const gmd = gmdUltimo(pesagens);
  const idade = idadeMeses(animal.nascimento);

  return {
    animalId: animal.id,
    identificador,
    snapshot: {
      brinco_visual: traco(animal.brinco_visual),
      sisbov: traco(animal.sisbov),
      categoria: traco(animal.categoria),
      raca: traco(animal.raca),
      sexo: traco(animal.sexo),
      status: traco(animal.status),
      lote: traco(loteNome),
      peso_atual: peso !== null ? String(peso) : "-",
    },
    metrics: [
      { label: "Raça", value: traco(animal.raca) },
      { label: "Peso atual", value: peso !== null ? `${peso} kg` : "-" },
      {
        label: "GMD",
        value:
          gmd !== null ? `${gmd.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg/d` : "-",
      },
      {
        label: "Status",
        value: STATUS_LABEL[animal.status as StatusAnimal] ?? traco(animal.status),
      },
    ],
    sections: [
      {
        title: "Identificação",
        head: ["Campo", "Informação"],
        body: [
          ["Brinco visual", traco(animal.brinco_visual)],
          ["SISBOV", traco(animal.sisbov)],
          ["RFID", traco(animal.rfid)],
          ["Categoria", traco(animal.categoria)],
          ["Sexo", animal.sexo === "macho" ? "Macho" : animal.sexo === "femea" ? "Fêmea" : "-"],
          ["Nascimento", traco(animal.nascimento)],
          ["Idade", idade !== null ? `${idade} meses` : "-"],
          ["Lote", traco(loteNome)],
        ],
      },
      {
        title: "Origem e genealogia",
        head: ["Campo", "Informação"],
        body: [
          ["Origem", animal.origem ? ORIGEM_LABEL[animal.origem as Origem] : "não declarada"],
          ["Estabelecimento de origem", traco(animal.origem_estabelecimento)],
          ["CAR de origem", traco(animal.origem_car)],
          ["Pai", animal.pai_id ? (brincoById.get(animal.pai_id) ?? "-") : "-"],
          ["Mãe", animal.mae_id ? (brincoById.get(animal.mae_id) ?? "-") : "-"],
          ["Observação", traco(animal.observacao)],
        ],
      },
      {
        title: "Histórico de pesagens",
        head: ["Data", "Peso (kg)", "Origem"],
        body: ordenarPesagens(pesagens).length
          ? ordenarPesagens(pesagens).map((p) => [p.data, p.peso_kg, p.origem])
          : [["-", "-", "sem pesagem registrada"]],
      },
      {
        title: "Eventos sanitários",
        head: ["Data", "Tipo", "Produto", "Libera em"],
        body: sanitarios.length
          ? sanitarios.map((s) => [s.data, traco(s.tipo), traco(s.produto), traco(s.libera_em)])
          : [["-", "-", "-", "sem evento registrado"]],
      },
    ],
  };
}
