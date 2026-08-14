// Régua de "mesma fazenda" do 360: texto livre, então a comparação ignora
// espaço, caixa e acento. Fica aqui — puro, sem Supabase — porque o perímetro
// (api/services) e a visão geral (lib/overview/talhao-360) precisam do MESMO
// critério; duplicar faria "Fazenda São João" e "fazenda sao joao" virarem
// duas fazendas em uma tela e uma só na outra.

export function normalizeFarmName(value?: string) {
  return String(value || "Fazenda ativa")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
