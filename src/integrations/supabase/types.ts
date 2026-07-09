export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      animal_pdf_records: {
        Row: {
          animal_identifier: string;
          animal_record_id: string;
          created_at: string;
          file_name: string;
          file_path: string;
          id: string;
          payload_snapshot: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          animal_identifier: string;
          animal_record_id: string;
          created_at?: string;
          file_name: string;
          file_path: string;
          id?: string;
          payload_snapshot?: Json;
          updated_at?: string;
          version?: number;
        };
        Update: {
          animal_identifier?: string;
          animal_record_id?: string;
          created_at?: string;
          file_name?: string;
          file_path?: string;
          id?: string;
          payload_snapshot?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      field_records: {
        Row: {
          created_at: string;
          id: string;
          module: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          module: string;
          payload?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_records: {
        Row: {
          created_at: string;
          id: string;
          module: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          module: string;
          payload?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          nome: string;
          slug: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      platform_admin_emails: {
        Row: { email: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
      admin_active_org: {
        Row: { user_id: string; org_id: string | null; updated_at: string };
        Insert: { user_id: string; org_id?: string | null; updated_at?: string };
        Update: { user_id?: string; org_id?: string | null; updated_at?: string };
        Relationships: [];
      };
      cost_centers: {
        Row: {
          id: string;
          nome: string;
          tipo: string;
          safra: string | null;
          talhao_id: string | null;
          valor_autorizado: number;
          valor_alocado: number;
          valor_realizado: number;
          vigencia_inicio: string | null;
          vigencia_fim: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          tipo?: string;
          safra?: string | null;
          talhao_id?: string | null;
          valor_autorizado?: number;
          valor_alocado?: number;
          valor_realizado?: number;
          vigencia_inicio?: string | null;
          vigencia_fim?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          tipo?: string;
          safra?: string | null;
          talhao_id?: string | null;
          valor_autorizado?: number;
          valor_alocado?: number;
          valor_realizado?: number;
          vigencia_inicio?: string | null;
          vigencia_fim?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          contrato: string;
          tipo: string;
          contraparte: string | null;
          cost_center_id: string | null;
          talhao_id: string | null;
          vigencia_inicio: string | null;
          vigencia_fim: string | null;
          qtd_contratada: number;
          qtd_liquidada: number;
          preco_unit: number;
          valor: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contrato: string;
          tipo?: string;
          contraparte?: string | null;
          cost_center_id?: string | null;
          talhao_id?: string | null;
          vigencia_inicio?: string | null;
          vigencia_fim?: string | null;
          qtd_contratada?: number;
          qtd_liquidada?: number;
          preco_unit?: number;
          valor?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contrato?: string;
          tipo?: string;
          contraparte?: string | null;
          cost_center_id?: string | null;
          talhao_id?: string | null;
          vigencia_inicio?: string | null;
          vigencia_fim?: string | null;
          qtd_contratada?: number;
          qtd_liquidada?: number;
          preco_unit?: number;
          valor?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      operation_records: {
        Row: {
          area: string;
          created_at: string;
          id: string;
          module: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          area: string;
          created_at?: string;
          id?: string;
          module: string;
          payload?: Json;
          updated_at?: string;
        };
        Update: {
          area?: string;
          created_at?: string;
          id?: string;
          module?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_lote: {
        Row: {
          id: string;
          nome: string;
          fase: string | null;
          sistema: string | null;
          centro_custo_id: string | null;
          peso_alvo_kg: number | null;
          aberto_em: string;
          encerrado_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          fase?: string | null;
          sistema?: string | null;
          centro_custo_id?: string | null;
          peso_alvo_kg?: number | null;
          aberto_em?: string;
          encerrado_em?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          fase?: string | null;
          sistema?: string | null;
          centro_custo_id?: string | null;
          peso_alvo_kg?: number | null;
          aberto_em?: string;
          encerrado_em?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_animal: {
        Row: {
          id: string;
          brinco_visual: string | null;
          sisbov: string | null;
          rfid: string | null;
          categoria: string | null;
          sexo: string | null;
          raca: string | null;
          nascimento: string | null;
          pai_id: string | null;
          mae_id: string | null;
          lote_id: string | null;
          origem: string | null;
          origem_estabelecimento: string | null;
          origem_car: string | null;
          status: string;
          foto_url: string | null;
          observacao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brinco_visual?: string | null;
          sisbov?: string | null;
          rfid?: string | null;
          categoria?: string | null;
          sexo?: string | null;
          raca?: string | null;
          nascimento?: string | null;
          pai_id?: string | null;
          mae_id?: string | null;
          lote_id?: string | null;
          origem?: string | null;
          origem_estabelecimento?: string | null;
          origem_car?: string | null;
          status?: string;
          foto_url?: string | null;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brinco_visual?: string | null;
          sisbov?: string | null;
          rfid?: string | null;
          categoria?: string | null;
          sexo?: string | null;
          raca?: string | null;
          nascimento?: string | null;
          pai_id?: string | null;
          mae_id?: string | null;
          lote_id?: string | null;
          origem?: string | null;
          origem_estabelecimento?: string | null;
          origem_car?: string | null;
          status?: string;
          foto_url?: string | null;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_pesagem: {
        Row: {
          id: string;
          animal_id: string;
          data: string;
          peso_kg: number;
          origem: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          data?: string;
          peso_kg: number;
          origem?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          data?: string;
          peso_kg?: number;
          origem?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_evento_sanitario: {
        Row: {
          id: string;
          animal_id: string | null;
          lote_id: string | null;
          tipo: string | null;
          produto: string | null;
          data: string;
          carencia_dias: number;
          libera_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id?: string | null;
          lote_id?: string | null;
          tipo?: string | null;
          produto?: string | null;
          data?: string;
          carencia_dias?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string | null;
          lote_id?: string | null;
          tipo?: string | null;
          produto?: string | null;
          data?: string;
          carencia_dias?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_evento_reprodutivo: {
        Row: {
          id: string;
          animal_id: string | null;
          tipo: string | null;
          protocolo: string | null;
          touro_id: string | null;
          semen_touro: string | null;
          resultado: string | null;
          data: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id?: string | null;
          tipo?: string | null;
          protocolo?: string | null;
          touro_id?: string | null;
          semen_touro?: string | null;
          resultado?: string | null;
          data?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string | null;
          tipo?: string | null;
          protocolo?: string | null;
          touro_id?: string | null;
          semen_touro?: string | null;
          resultado?: string | null;
          data?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_ocupacao: {
        Row: {
          id: string;
          lote_id: string;
          talhao_id: string;
          data_entrada: string;
          data_saida: string | null;
          gta_entrada: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lote_id: string;
          talhao_id: string;
          data_entrada?: string;
          data_saida?: string | null;
          gta_entrada?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lote_id?: string;
          talhao_id?: string;
          data_entrada?: string;
          data_saida?: string | null;
          gta_entrada?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_config: {
        Row: {
          id: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_estoque_semen: {
        Row: {
          id: string;
          touro: string;
          partida: string | null;
          doses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          touro: string;
          partida?: string | null;
          doses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          touro?: string;
          partida?: string | null;
          doses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_producao: {
        Row: {
          id: string;
          animal_id: string | null;
          lote_id: string | null;
          produto: string;
          quantidade: number;
          unidade: string | null;
          data: string;
          observacao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          animal_id?: string | null;
          lote_id?: string | null;
          produto: string;
          quantidade?: number;
          unidade?: string | null;
          data?: string;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string | null;
          lote_id?: string | null;
          produto?: string;
          quantidade?: number;
          unidade?: string | null;
          data?: string;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pec_movimentacao_gta: {
        Row: {
          id: string;
          numero: string;
          data: string;
          sentido: string;
          contraparte: string | null;
          quantidade: number;
          nfe_vinculada: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero: string;
          data?: string;
          sentido?: string;
          contraparte?: string | null;
          quantidade?: number;
          nfe_vinculada?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero?: string;
          data?: string;
          sentido?: string;
          contraparte?: string | null;
          quantidade?: number;
          nfe_vinculada?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_gmd_animal: {
        Row: {
          animal_id: string | null;
          org_id: string | null;
          intervalos: number | null;
          gmd_atual: number | null;
          gmd_medio: number | null;
          ultima_pesagem: string | null;
        };
        Relationships: [];
      };
      v_animal_carencia: {
        Row: {
          animal_id: string | null;
          org_id: string | null;
          libera_em: string | null;
        };
        Relationships: [];
      };
      v_dossie_animal: {
        Row: {
          animal_id: string | null;
          org_id: string | null;
          ordem: number | null;
          talhao_id: string | null;
          estabelecimento: string | null;
          car: string | null;
          data_entrada: string | null;
          data_saida: string | null;
          tipo_elo: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
