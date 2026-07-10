// Store do modo DEMO de Insumos: mocks base + delta CRUD em localStorage.
// A camada api/services.ts consulta este store quando o DEMO está ativo —
// nada é enviado ao Supabase.
import { createDemoStore, DEMO_STORE_KEYS } from "@/lib/demo-store";
import { demoInsumosBase } from "@/features/insumos/data/mocks";

export const insumosDemoStore = createDemoStore(DEMO_STORE_KEYS.insumos, demoInsumosBase);
