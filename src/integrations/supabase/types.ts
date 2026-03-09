export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          id: string
          message: string | null
          patient_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source_metric: string | null
          source_test_id: string | null
          source_value: number | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          message?: string | null
          patient_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_metric?: string | null
          source_test_id?: string | null
          source_value?: number | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          message?: string | null
          patient_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_metric?: string | null
          source_test_id?: string | null
          source_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_source_test_id_fkey"
            columns: ["source_test_id"]
            isOneToOne: false
            referencedRelation: "clinical_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          patient_id: string | null
          resource_id: string | null
          resource_type: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          patient_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          patient_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bundles: {
        Row: {
          code: string
          descripcion: string | null
          id: string
          nombre: string
          phase: Database["public"]["Enums"]["phase_journey"] | null
          program_codes: string[] | null
        }
        Insert: {
          code: string
          descripcion?: string | null
          id?: string
          nombre: string
          phase?: Database["public"]["Enums"]["phase_journey"] | null
          program_codes?: string[] | null
        }
        Update: {
          code?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          phase?: Database["public"]["Enums"]["phase_journey"] | null
          program_codes?: string[] | null
        }
        Relationships: []
      }
      clinical_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          new_phase: Database["public"]["Enums"]["phase_journey"] | null
          patient_id: string
          performed_by: string | null
          performed_by_name: string | null
          previous_phase: Database["public"]["Enums"]["phase_journey"] | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_phase?: Database["public"]["Enums"]["phase_journey"] | null
          patient_id: string
          performed_by?: string | null
          performed_by_name?: string | null
          previous_phase?: Database["public"]["Enums"]["phase_journey"] | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_phase?: Database["public"]["Enums"]["phase_journey"] | null
          patient_id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          previous_phase?: Database["public"]["Enums"]["phase_journey"] | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          patient_id: string
          tipo: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          patient_id: string
          tipo?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          patient_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_tests: {
        Row: {
          created_at: string
          id: string
          is_baseline: boolean | null
          notas: string | null
          patient_id: string
          staff_id: string | null
          tipo: Database["public"]["Enums"]["test_type"]
          valor_numerico: number | null
          valores_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_baseline?: boolean | null
          notas?: string | null
          patient_id: string
          staff_id?: string | null
          tipo: Database["public"]["Enums"]["test_type"]
          valor_numerico?: number | null
          valores_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_baseline?: boolean | null
          notas?: string | null
          patient_id?: string
          staff_id?: string | null
          tipo?: Database["public"]["Enums"]["test_type"]
          valor_numerico?: number | null
          valores_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          code: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          phases: Database["public"]["Enums"]["phase_journey"][] | null
          tipo: string | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          phases?: Database["public"]["Enums"]["phase_journey"][] | null
          tipo?: string | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          phases?: Database["public"]["Enums"]["phase_journey"][] | null
          tipo?: string | null
          title?: string
        }
        Relationships: []
      }
      crisis_orders: {
        Row: {
          created_at: string
          id: string
          notas: string | null
          patient_id: string
          program: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          trigger_reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          notas?: string | null
          patient_id: string
          program?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          trigger_reason: string
        }
        Update: {
          created_at?: string
          id?: string
          notas?: string | null
          patient_id?: string
          program?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          trigger_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "crisis_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      incentives: {
        Row: {
          clinical_test_id: string | null
          concepto: Database["public"]["Enums"]["incentive_concept"]
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["incentive_status"] | null
          id: string
          mes_liquidacion: string | null
          monto: number
          session_id: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          clinical_test_id?: string | null
          concepto: Database["public"]["Enums"]["incentive_concept"]
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["incentive_status"] | null
          id?: string
          mes_liquidacion?: string | null
          monto: number
          session_id?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          clinical_test_id?: string | null
          concepto?: Database["public"]["Enums"]["incentive_concept"]
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["incentive_status"] | null
          id?: string
          mes_liquidacion?: string | null
          monto?: number
          session_id?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentives_clinical_test_id_fkey"
            columns: ["clinical_test_id"]
            isOneToOne: false
            referencedRelation: "clinical_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentives_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          session_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          session_id?: string | null
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          session_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_assignments: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_content: {
        Row: {
          content_id: string
          created_at: string
          enabled: boolean | null
          id: string
          patient_id: string
          sent_date: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          patient_id: string
          sent_date?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          patient_id?: string
          sent_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_content_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_content_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active_status: boolean
          alert_status: Database["public"]["Enums"]["alert_status_enum"] | null
          assigned_bundles: string[] | null
          assigned_programs: string[] | null
          assigned_staff_ids: string[] | null
          codigo: string
          created_at: string
          diagnostico: string | null
          edad: number | null
          email: string | null
          estadio: string | null
          fase_journey: Database["public"]["Enums"]["phase_journey"]
          fecha_diagnostico: string | null
          genero: string | null
          high_fall_risk: boolean | null
          id: string
          mind_state: Database["public"]["Enums"]["mind_state_enum"] | null
          nombre: string
          oncologo_referente: string | null
          telefono: string | null
          tipo_cancer: string | null
          updated_at: string
        }
        Insert: {
          active_status?: boolean
          alert_status?: Database["public"]["Enums"]["alert_status_enum"] | null
          assigned_bundles?: string[] | null
          assigned_programs?: string[] | null
          assigned_staff_ids?: string[] | null
          codigo: string
          created_at?: string
          diagnostico?: string | null
          edad?: number | null
          email?: string | null
          estadio?: string | null
          fase_journey?: Database["public"]["Enums"]["phase_journey"]
          fecha_diagnostico?: string | null
          genero?: string | null
          high_fall_risk?: boolean | null
          id?: string
          mind_state?: Database["public"]["Enums"]["mind_state_enum"] | null
          nombre: string
          oncologo_referente?: string | null
          telefono?: string | null
          tipo_cancer?: string | null
          updated_at?: string
        }
        Update: {
          active_status?: boolean
          alert_status?: Database["public"]["Enums"]["alert_status_enum"] | null
          assigned_bundles?: string[] | null
          assigned_programs?: string[] | null
          assigned_staff_ids?: string[] | null
          codigo?: string
          created_at?: string
          diagnostico?: string | null
          edad?: number | null
          email?: string | null
          estadio?: string | null
          fase_journey?: Database["public"]["Enums"]["phase_journey"]
          fecha_diagnostico?: string | null
          genero?: string | null
          high_fall_risk?: boolean | null
          id?: string
          mind_state?: Database["public"]["Enums"]["mind_state_enum"] | null
          nombre?: string
          oncologo_referente?: string | null
          telefono?: string | null
          tipo_cancer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          billing_cycle: Database["public"]["Enums"]["plan_billing_cycle"]
          created_at: string
          description: string | null
          id: string
          max_sessions: number | null
          name: string
          price_annual: number | null
          price_monthly: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_cycle?: Database["public"]["Enums"]["plan_billing_cycle"]
          created_at?: string
          description?: string | null
          id?: string
          max_sessions?: number | null
          name: string
          price_annual?: number | null
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_cycle?: Database["public"]["Enums"]["plan_billing_cycle"]
          created_at?: string
          description?: string | null
          id?: string
          max_sessions?: number | null
          name?: string
          price_annual?: number | null
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          especialidad: string | null
          id: string
          nombre: string
          suspended: boolean
          tarifa_fijo: number | null
          telefono: string | null
          total_acumulado: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          id?: string
          nombre: string
          suspended?: boolean
          tarifa_fijo?: number | null
          telefono?: string | null
          total_acumulado?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          id?: string
          nombre?: string
          suspended?: boolean
          tarifa_fijo?: number | null
          telefono?: string | null
          total_acumulado?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string
          descripcion: string | null
          duracion: string | null
          id: string
          nombre: string
          sesiones: number | null
          tipo: Database["public"]["Enums"]["program_type"]
        }
        Insert: {
          code: string
          descripcion?: string | null
          duracion?: string | null
          id?: string
          nombre: string
          sesiones?: number | null
          tipo: Database["public"]["Enums"]["program_type"]
        }
        Update: {
          code?: string
          descripcion?: string | null
          duracion?: string | null
          id?: string
          nombre?: string
          sesiones?: number | null
          tipo?: Database["public"]["Enums"]["program_type"]
        }
        Relationships: []
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          fecha: string
          id: string
          notas: string | null
          patient_id: string
          programa_code: string
          staff_id: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          therapist_name: string | null
          tipo_programa: Database["public"]["Enums"]["program_type"] | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          fecha: string
          id?: string
          notas?: string | null
          patient_id: string
          programa_code: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          therapist_name?: string | null
          tipo_programa?: Database["public"]["Enums"]["program_type"] | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          patient_id?: string
          programa_code?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          therapist_name?: string | null
          tipo_programa?: Database["public"]["Enums"]["program_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          patient_id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_governance: {
        Row: {
          emergency_lock_active: boolean
          id: string
          locked_at: string | null
          locked_by: string | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          emergency_lock_active?: boolean
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          emergency_lock_active?: boolean
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_patient: {
        Args: { _patient_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status_enum: "verde" | "amarillo" | "rojo"
      alert_type: "emotional_risk" | "fall_risk" | "clinical_decline" | "custom"
      app_role:
        | "admin"
        | "fisioterapeuta"
        | "psicologo"
        | "nutricionista"
        | "director"
        | "entrenador"
        | "psiconcologo"
      expense_category:
        | "payroll"
        | "equipment"
        | "rent"
        | "software"
        | "marketing"
        | "other"
      incentive_concept: "fijo" | "hito_clinico" | "video_rrss" | "bono_extra"
      incentive_status: "pendiente" | "aprobado" | "pagado"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      mind_state_enum:
        | "Activo"
        | "Ansioso"
        | "Depresivo"
        | "Resiliente"
        | "Vulnerable"
      payment_method: "transfer" | "card" | "cash" | "other"
      phase_journey: "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8"
      plan_billing_cycle: "monthly" | "annual" | "one_time"
      program_type: "FX" | "PS" | "NU" | "EO" | "TS"
      session_status: "pendiente" | "confirmada" | "realizada" | "cancelada"
      subscription_status: "active" | "paused" | "cancelled" | "expired"
      test_type:
        | "30STS"
        | "TUG"
        | "Handgrip"
        | "6MWT"
        | "PHQ-9"
        | "GAD-7"
        | "FACIT-F"
        | "EORTC"
        | "Transverso"
        | "Balance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status_enum: ["verde", "amarillo", "rojo"],
      alert_type: ["emotional_risk", "fall_risk", "clinical_decline", "custom"],
      app_role: [
        "admin",
        "fisioterapeuta",
        "psicologo",
        "nutricionista",
        "director",
        "entrenador",
        "psiconcologo",
      ],
      expense_category: [
        "payroll",
        "equipment",
        "rent",
        "software",
        "marketing",
        "other",
      ],
      incentive_concept: ["fijo", "hito_clinico", "video_rrss", "bono_extra"],
      incentive_status: ["pendiente", "aprobado", "pagado"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      mind_state_enum: [
        "Activo",
        "Ansioso",
        "Depresivo",
        "Resiliente",
        "Vulnerable",
      ],
      payment_method: ["transfer", "card", "cash", "other"],
      phase_journey: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"],
      plan_billing_cycle: ["monthly", "annual", "one_time"],
      program_type: ["FX", "PS", "NU", "EO", "TS"],
      session_status: ["pendiente", "confirmada", "realizada", "cancelada"],
      subscription_status: ["active", "paused", "cancelled", "expired"],
      test_type: [
        "30STS",
        "TUG",
        "Handgrip",
        "6MWT",
        "PHQ-9",
        "GAD-7",
        "FACIT-F",
        "EORTC",
        "Transverso",
        "Balance",
      ],
    },
  },
} as const
