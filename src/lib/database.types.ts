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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ambiti_richiesta_intervento: {
        Row: {
          attivo: boolean
          codice: string
          created_at: string
          denominazione: string
          id: string
        }
        Insert: {
          attivo?: boolean
          codice: string
          created_at?: string
          denominazione: string
          id?: string
        }
        Update: {
          attivo?: boolean
          codice?: string
          created_at?: string
          denominazione?: string
          id?: string
        }
        Relationships: []
      }
      atti: {
        Row: {
          anno: number | null
          created_at: string
          data: string | null
          ente_id: string
          id: string
          link_documento: string | null
          note: string | null
          numero: string | null
          oggetto: string | null
          protocollo: string | null
          registro: string | null
          tipo: Database["public"]["Enums"]["atto_tipo"]
        }
        Insert: {
          anno?: number | null
          created_at?: string
          data?: string | null
          ente_id: string
          id?: string
          link_documento?: string | null
          note?: string | null
          numero?: string | null
          oggetto?: string | null
          protocollo?: string | null
          registro?: string | null
          tipo: Database["public"]["Enums"]["atto_tipo"]
        }
        Update: {
          anno?: number | null
          created_at?: string
          data?: string | null
          ente_id?: string
          id?: string
          link_documento?: string | null
          note?: string | null
          numero?: string | null
          oggetto?: string | null
          protocollo?: string | null
          registro?: string | null
          tipo?: Database["public"]["Enums"]["atto_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "atti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      atti_intervento: {
        Row: {
          atto_id: string
          intervento_id: string
        }
        Insert: {
          atto_id: string
          intervento_id: string
        }
        Update: {
          atto_id?: string
          intervento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atti_intervento_atto_id_fkey"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "atti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "atti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      attributi_tipologia_impianto: {
        Row: {
          attivo: boolean
          codice: string
          created_at: string
          denominazione: string
          id: string
          obbligatorio: boolean
          opzioni: Json | null
          ordine: number
          tipo: string
          tipologia_id: string
          unita: string | null
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          codice: string
          created_at?: string
          denominazione: string
          id?: string
          obbligatorio?: boolean
          opzioni?: Json | null
          ordine?: number
          tipo?: string
          tipologia_id: string
          unita?: string | null
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          codice?: string
          created_at?: string
          denominazione?: string
          id?: string
          obbligatorio?: boolean
          opzioni?: Json | null
          ordine?: number
          tipo?: string
          tipologia_id?: string
          unita?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributi_tipologia_impianto_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "tipologie_impianto"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          azione: string
          ente_id: string | null
          id: number
          intervento_id: string | null
          ip: unknown
          record_id: string | null
          tabella: string | null
          timestamp: string
          user_id: string | null
          valore_nuovo: Json | null
          valore_precedente: Json | null
        }
        Insert: {
          azione: string
          ente_id?: string | null
          id?: never
          intervento_id?: string | null
          ip?: unknown
          record_id?: string | null
          tabella?: string | null
          timestamp?: string
          user_id?: string | null
          valore_nuovo?: Json | null
          valore_precedente?: Json | null
        }
        Update: {
          azione?: string
          ente_id?: string | null
          id?: never
          intervento_id?: string | null
          ip?: unknown
          record_id?: string | null
          tabella?: string | null
          timestamp?: string
          user_id?: string | null
          valore_nuovo?: Json | null
          valore_precedente?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "audit_log_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "audit_log_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      colluadi: {
        Row: {
          atto_id: string | null
          data_fine: string | null
          data_inizio: string | null
          data_nomina: string | null
          esito: string | null
          id: string
          intervento_id: string
          note: string | null
          persona_id: string | null
          tipo: string
        }
        Insert: {
          atto_id?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          data_nomina?: string | null
          esito?: string | null
          id?: string
          intervento_id: string
          note?: string | null
          persona_id?: string | null
          tipo: string
        }
        Update: {
          atto_id?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          data_nomina?: string | null
          esito?: string | null
          id?: string
          intervento_id?: string
          note?: string | null
          persona_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "colluadi_atto_id_fkey"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colluadi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "colluadi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "colluadi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colluadi_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "persone"
            referencedColumns: ["id"]
          },
        ]
      }
      contratti: {
        Row: {
          cig: string | null
          data_consegna: string | null
          data_fine_effettiva: string | null
          data_fine_prevista: string | null
          data_stipula: string | null
          id: string
          importo: number
          intervento_id: string
          note: string | null
          numero_contratto: string | null
          operatore_id: string | null
          procedura_id: string | null
          stato: string | null
        }
        Insert: {
          cig?: string | null
          data_consegna?: string | null
          data_fine_effettiva?: string | null
          data_fine_prevista?: string | null
          data_stipula?: string | null
          id?: string
          importo?: number
          intervento_id: string
          note?: string | null
          numero_contratto?: string | null
          operatore_id?: string | null
          procedura_id?: string | null
          stato?: string | null
        }
        Update: {
          cig?: string | null
          data_consegna?: string | null
          data_fine_effettiva?: string | null
          data_fine_prevista?: string | null
          data_stipula?: string | null
          id?: string
          importo?: number
          intervento_id?: string
          note?: string | null
          numero_contratto?: string | null
          operatore_id?: string | null
          procedura_id?: string | null
          stato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "contratti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "contratti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_operatore_id_fkey"
            columns: ["operatore_id"]
            isOneToOne: false
            referencedRelation: "operatori_economici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratti_procedura_id_fkey"
            columns: ["procedura_id"]
            isOneToOne: false
            referencedRelation: "procedure_affidamento"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_config: {
        Row: {
          created_at: string
          dashboard_key: string
          ente_id: string
          id: string
          ordine: number
          titolo: string
          updated_at: string
          visibile: boolean
        }
        Insert: {
          created_at?: string
          dashboard_key: string
          ente_id: string
          id?: string
          ordine?: number
          titolo: string
          updated_at?: string
          visibile?: boolean
        }
        Update: {
          created_at?: string
          dashboard_key?: string
          ente_id?: string
          id?: string
          ordine?: number
          titolo?: string
          updated_at?: string
          visibile?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_config_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      dati_catastali: {
        Row: {
          categoria: string | null
          comune: string | null
          consistenza: string | null
          edificio_id: string
          foglio: string | null
          id: string
          note: string | null
          particella: string | null
          provincia: string | null
          subalterno: string | null
          superficie_catastale: number | null
        }
        Insert: {
          categoria?: string | null
          comune?: string | null
          consistenza?: string | null
          edificio_id: string
          foglio?: string | null
          id?: string
          note?: string | null
          particella?: string | null
          provincia?: string | null
          subalterno?: string | null
          superficie_catastale?: number | null
        }
        Update: {
          categoria?: string | null
          comune?: string | null
          consistenza?: string | null
          edificio_id?: string
          foglio?: string | null
          id?: string
          note?: string | null
          particella?: string | null
          provincia?: string | null
          subalterno?: string | null
          superficie_catastale?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dati_catastali_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dati_catastali_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
        ]
      }
      documenti: {
        Row: {
          atto_id: string | null
          created_at: string
          created_by: string | null
          data_documento: string | null
          firmato_digitalmente: boolean | null
          formato: string | null
          hash_file: string | null
          id: string
          intervento_id: string | null
          mime_type: string | null
          nome: string
          note: string | null
          progetto_id: string | null
          record_id: string | null
          sezione: string
          size_bytes: number | null
          tipo: Database["public"]["Enums"]["documento_tipo"]
          updated_at: string
          url: string | null
          versione: number | null
        }
        Insert: {
          atto_id?: string | null
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          firmato_digitalmente?: boolean | null
          formato?: string | null
          hash_file?: string | null
          id?: string
          intervento_id?: string | null
          mime_type?: string | null
          nome: string
          note?: string | null
          progetto_id?: string | null
          record_id?: string | null
          sezione?: string
          size_bytes?: number | null
          tipo: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string
          url?: string | null
          versione?: number | null
        }
        Update: {
          atto_id?: string | null
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          firmato_digitalmente?: boolean | null
          formato?: string | null
          hash_file?: string | null
          id?: string
          intervento_id?: string | null
          mime_type?: string | null
          nome?: string
          note?: string | null
          progetto_id?: string | null
          record_id?: string | null
          sezione?: string
          size_bytes?: number | null
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string
          url?: string | null
          versione?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documenti_atto_id_fkey"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "documenti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "documenti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_progetto_id_fkey"
            columns: ["progetto_id"]
            isOneToOne: false
            referencedRelation: "progetti"
            referencedColumns: ["id"]
          },
        ]
      }
      documenti_immobile: {
        Row: {
          created_at: string
          created_by: string | null
          data_documento: string | null
          data_emissione: string | null
          data_prossima_verifica: string | null
          data_scadenza: string | null
          ditta: string | null
          edificio_id: string
          emittente: string | null
          ente_id: string
          id: string
          impianto_id: string | null
          mime_type: string | null
          nome_file: string
          note: string | null
          numero: string | null
          periodicita_mesi: number | null
          protocollo: string | null
          size_bytes: number | null
          stato: string
          storage_path: string
          tecnico: string | null
          tipologia_id: string
          titolo: string
          updated_at: string
          versione: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          data_emissione?: string | null
          data_prossima_verifica?: string | null
          data_scadenza?: string | null
          ditta?: string | null
          edificio_id: string
          emittente?: string | null
          ente_id: string
          id?: string
          impianto_id?: string | null
          mime_type?: string | null
          nome_file: string
          note?: string | null
          numero?: string | null
          periodicita_mesi?: number | null
          protocollo?: string | null
          size_bytes?: number | null
          stato?: string
          storage_path: string
          tecnico?: string | null
          tipologia_id: string
          titolo: string
          updated_at?: string
          versione?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          data_emissione?: string | null
          data_prossima_verifica?: string | null
          data_scadenza?: string | null
          ditta?: string | null
          edificio_id?: string
          emittente?: string | null
          ente_id?: string
          id?: string
          impianto_id?: string | null
          mime_type?: string | null
          nome_file?: string
          note?: string | null
          numero?: string | null
          periodicita_mesi?: number | null
          protocollo?: string | null
          size_bytes?: number | null
          stato?: string
          storage_path?: string
          tecnico?: string | null
          tipologia_id?: string
          titolo?: string
          updated_at?: string
          versione?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documenti_immobile_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_immobile_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_immobile_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "documenti_immobile_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_immobile_impianto_id_fkey"
            columns: ["impianto_id"]
            isOneToOne: false
            referencedRelation: "impianti_manutentivi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documenti_immobile_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "tipologie_documenti_immobile"
            referencedColumns: ["id"]
          },
        ]
      }
      edifici: {
        Row: {
          anno_adeguamento: number | null
          anno_costruzione: number | null
          cap: string | null
          centro_di_costo: string | null
          civico: string | null
          codice_edificio: string
          comune: string | null
          created_at: string
          denominazione: string
          ente_id: string
          id: string
          indirizzo: string | null
          latitudine: number | null
          longitudine: number | null
          note: string | null
          provincia: string | null
          stato_immobile: string | null
          superficie: number | null
          tipologia_scolastica: string | null
          updated_at: string
          volume: number | null
        }
        Insert: {
          anno_adeguamento?: number | null
          anno_costruzione?: number | null
          cap?: string | null
          centro_di_costo?: string | null
          civico?: string | null
          codice_edificio: string
          comune?: string | null
          created_at?: string
          denominazione: string
          ente_id: string
          id?: string
          indirizzo?: string | null
          latitudine?: number | null
          longitudine?: number | null
          note?: string | null
          provincia?: string | null
          stato_immobile?: string | null
          superficie?: number | null
          tipologia_scolastica?: string | null
          updated_at?: string
          volume?: number | null
        }
        Update: {
          anno_adeguamento?: number | null
          anno_costruzione?: number | null
          cap?: string | null
          centro_di_costo?: string | null
          civico?: string | null
          codice_edificio?: string
          comune?: string | null
          created_at?: string
          denominazione?: string
          ente_id?: string
          id?: string
          indirizzo?: string | null
          latitudine?: number | null
          longitudine?: number | null
          note?: string | null
          provincia?: string | null
          stato_immobile?: string | null
          superficie?: number | null
          tipologia_scolastica?: string | null
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "edifici_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      edifici_permessi: {
        Row: {
          all_buildings: boolean
          can_delete: boolean
          can_update: boolean
          created_at: string
          edificio_id: string | null
          ente_id: string
          id: string
          user_id: string
        }
        Insert: {
          all_buildings?: boolean
          can_delete?: boolean
          can_update?: boolean
          created_at?: string
          edificio_id?: string | null
          ente_id: string
          id?: string
          user_id: string
        }
        Update: {
          all_buildings?: boolean
          can_delete?: boolean
          can_update?: boolean
          created_at?: string
          edificio_id?: string | null
          ente_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edifici_permessi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edifici_permessi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "edifici_permessi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      enti: {
        Row: {
          attivo: boolean
          codice_fiscale: string | null
          codice_ipa: string | null
          created_at: string
          denominazione: string
          email: string | null
          id: string
          logo_path: string | null
          pec: string | null
          telefono: string | null
          tipo_ente: string | null
          ui_palette: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          codice_fiscale?: string | null
          codice_ipa?: string | null
          created_at?: string
          denominazione: string
          email?: string | null
          id?: string
          logo_path?: string | null
          pec?: string | null
          telefono?: string | null
          tipo_ente?: string | null
          ui_palette?: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          codice_fiscale?: string | null
          codice_ipa?: string | null
          created_at?: string
          denominazione?: string
          email?: string | null
          id?: string
          logo_path?: string | null
          pec?: string | null
          telefono?: string | null
          tipo_ente?: string | null
          ui_palette?: string
          updated_at?: string
        }
        Relationships: []
      }
      fasi_intervento: {
        Row: {
          data_effettiva_fine: string | null
          data_effettiva_inizio: string | null
          data_prevista_fine: string | null
          data_prevista_inizio: string | null
          fase: Database["public"]["Enums"]["fase_tipo"]
          id: string
          intervento_id: string
          note: string | null
          percentuale_avanzamento: number
          stato: string | null
        }
        Insert: {
          data_effettiva_fine?: string | null
          data_effettiva_inizio?: string | null
          data_prevista_fine?: string | null
          data_prevista_inizio?: string | null
          fase: Database["public"]["Enums"]["fase_tipo"]
          id?: string
          intervento_id: string
          note?: string | null
          percentuale_avanzamento?: number
          stato?: string | null
        }
        Update: {
          data_effettiva_fine?: string | null
          data_effettiva_inizio?: string | null
          data_prevista_fine?: string | null
          data_prevista_inizio?: string | null
          fase?: Database["public"]["Enums"]["fase_tipo"]
          id?: string
          intervento_id?: string
          note?: string | null
          percentuale_avanzamento?: number
          stato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fasi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "fasi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "fasi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      finanziamenti_intervento: {
        Row: {
          annualita: number | null
          atto_finanziamento: string | null
          data_finanziamento: string | null
          fonte_id: string
          id: string
          importo: number
          intervento_id: string
          note: string | null
          percentuale: number | null
        }
        Insert: {
          annualita?: number | null
          atto_finanziamento?: string | null
          data_finanziamento?: string | null
          fonte_id: string
          id?: string
          importo?: number
          intervento_id: string
          note?: string | null
          percentuale?: number | null
        }
        Update: {
          annualita?: number | null
          atto_finanziamento?: string | null
          data_finanziamento?: string | null
          fonte_id?: string
          id?: string
          importo?: number
          intervento_id?: string
          note?: string | null
          percentuale?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finanziamenti_intervento_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "fonti_finanziamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      fonti_finanziamento: {
        Row: {
          attivo: boolean
          codice: string | null
          componente: string | null
          denominazione: string
          ente_finanziatore: string | null
          id: string
          investimento: string | null
          missione: string | null
          misura: string | null
          programma: string | null
          tipologia: string | null
        }
        Insert: {
          attivo?: boolean
          codice?: string | null
          componente?: string | null
          denominazione: string
          ente_finanziatore?: string | null
          id?: string
          investimento?: string | null
          missione?: string | null
          misura?: string | null
          programma?: string | null
          tipologia?: string | null
        }
        Update: {
          attivo?: boolean
          codice?: string | null
          componente?: string | null
          denominazione?: string
          ente_finanziatore?: string | null
          id?: string
          investimento?: string | null
          missione?: string | null
          misura?: string | null
          programma?: string | null
          tipologia?: string | null
        }
        Relationships: []
      }
      impianti_manutentivi: {
        Row: {
          anno_installazione: number | null
          codice: string | null
          conformita: boolean
          created_at: string
          created_by: string | null
          data_collaudo: string | null
          data_installazione: string | null
          data_prossima_manutenzione: string | null
          data_prossimo_controllo_periodico: string | null
          data_ultima_manutenzione: string | null
          data_ultimo_controllo_periodico: string | null
          data_verifica: string | null
          denominazione: string
          ditta_manutentrice: string | null
          edificio_id: string
          ente_id: string
          id: string
          marca_modello: string | null
          matricola: string | null
          note: string | null
          numero_rapporto: string | null
          periodicita_mesi: number | null
          referente: string | null
          stato: string
          tipo: string
          ubicazione: string | null
          updated_at: string
        }
        Insert: {
          anno_installazione?: number | null
          codice?: string | null
          conformita?: boolean
          created_at?: string
          created_by?: string | null
          data_collaudo?: string | null
          data_installazione?: string | null
          data_prossima_manutenzione?: string | null
          data_prossimo_controllo_periodico?: string | null
          data_ultima_manutenzione?: string | null
          data_ultimo_controllo_periodico?: string | null
          data_verifica?: string | null
          denominazione: string
          ditta_manutentrice?: string | null
          edificio_id: string
          ente_id: string
          id?: string
          marca_modello?: string | null
          matricola?: string | null
          note?: string | null
          numero_rapporto?: string | null
          periodicita_mesi?: number | null
          referente?: string | null
          stato?: string
          tipo: string
          ubicazione?: string | null
          updated_at?: string
        }
        Update: {
          anno_installazione?: number | null
          codice?: string | null
          conformita?: boolean
          created_at?: string
          created_by?: string | null
          data_collaudo?: string | null
          data_installazione?: string | null
          data_prossima_manutenzione?: string | null
          data_prossimo_controllo_periodico?: string | null
          data_ultima_manutenzione?: string | null
          data_ultimo_controllo_periodico?: string | null
          data_verifica?: string | null
          denominazione?: string
          ditta_manutentrice?: string | null
          edificio_id?: string
          ente_id?: string
          id?: string
          marca_modello?: string | null
          matricola?: string | null
          note?: string | null
          numero_rapporto?: string | null
          periodicita_mesi?: number | null
          referente?: string | null
          stato?: string
          tipo?: string
          ubicazione?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "impianti_manutentivi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impianti_manutentivi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impianti_manutentivi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "impianti_manutentivi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      impianti_termici_matricole: {
        Row: {
          created_at: string
          id: string
          impianto_id: string
          matricola_inail: string
          note: string | null
          potenza_kw: number | null
          tipo_matricola: string
          updated_at: string
          vigente: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          impianto_id: string
          matricola_inail: string
          note?: string | null
          potenza_kw?: number | null
          tipo_matricola?: string
          updated_at?: string
          vigente?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          impianto_id?: string
          matricola_inail?: string
          note?: string | null
          potenza_kw?: number | null
          tipo_matricola?: string
          updated_at?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "impianti_termici_matricole_impianto_id_fkey"
            columns: ["impianto_id"]
            isOneToOne: false
            referencedRelation: "impianti_manutentivi"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batch_impianti: {
        Row: {
          anomalie: number
          created_at: string
          created_by: string | null
          ente_id: string
          esclusi: number
          id: string
          impianti_rilevati: number
          importabili: number
          nome_file: string
          righe_csv: number
          stato: string
          tipo_import: string
          updated_at: string
        }
        Insert: {
          anomalie?: number
          created_at?: string
          created_by?: string | null
          ente_id: string
          esclusi?: number
          id?: string
          impianti_rilevati?: number
          importabili?: number
          nome_file: string
          righe_csv?: number
          stato?: string
          tipo_import?: string
          updated_at?: string
        }
        Update: {
          anomalie?: number
          created_at?: string
          created_by?: string | null
          ente_id?: string
          esclusi?: number
          id?: string
          impianti_rilevati?: number
          importabili?: number
          nome_file?: string
          righe_csv?: number
          stato?: string
          tipo_import?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batch_impianti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batch_impianti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      import_righe_impianti: {
        Row: {
          avvisi: Json
          batch_id: string
          codice_scuola: string | null
          controllo_efficienza: string | null
          created_at: string
          denominazione_csv: string | null
          edificio_confidenza: number
          edificio_id: string | null
          edificio_match_stato: string
          errori: Json
          id: string
          indirizzo_csv: string | null
          link_pratica: string | null
          matricola: string | null
          matricola_inail: string | null
          matricola_inail_vigente: string | null
          potenza_kw: number | null
          prossima_verifica: string | null
          raw_data: Json
          riga_csv: number
          selezionato: boolean
          sopra_116kw: boolean | null
          stato_suggerito: string
          ultima_verifica: string | null
        }
        Insert: {
          avvisi?: Json
          batch_id: string
          codice_scuola?: string | null
          controllo_efficienza?: string | null
          created_at?: string
          denominazione_csv?: string | null
          edificio_confidenza?: number
          edificio_id?: string | null
          edificio_match_stato?: string
          errori?: Json
          id?: string
          indirizzo_csv?: string | null
          link_pratica?: string | null
          matricola?: string | null
          matricola_inail?: string | null
          matricola_inail_vigente?: string | null
          potenza_kw?: number | null
          prossima_verifica?: string | null
          raw_data?: Json
          riga_csv: number
          selezionato?: boolean
          sopra_116kw?: boolean | null
          stato_suggerito?: string
          ultima_verifica?: string | null
        }
        Update: {
          avvisi?: Json
          batch_id?: string
          codice_scuola?: string | null
          controllo_efficienza?: string | null
          created_at?: string
          denominazione_csv?: string | null
          edificio_confidenza?: number
          edificio_id?: string | null
          edificio_match_stato?: string
          errori?: Json
          id?: string
          indirizzo_csv?: string | null
          link_pratica?: string | null
          matricola?: string | null
          matricola_inail?: string | null
          matricola_inail_vigente?: string | null
          potenza_kw?: number | null
          prossima_verifica?: string | null
          raw_data?: Json
          riga_csv?: number
          selezionato?: boolean
          sopra_116kw?: boolean | null
          stato_suggerito?: string
          ultima_verifica?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_righe_impianti_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batch_impianti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_righe_impianti_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_righe_impianti_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
        ]
      }
      incarichi_intervento: {
        Row: {
          atto_id: string | null
          data_fine: string | null
          data_inizio: string | null
          id: string
          intervento_id: string
          note: string | null
          persona_id: string
          ruolo: string
        }
        Insert: {
          atto_id?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          id?: string
          intervento_id: string
          note?: string | null
          persona_id: string
          ruolo: string
        }
        Update: {
          atto_id?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          id?: string
          intervento_id?: string
          note?: string | null
          persona_id?: string
          ruolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "incarichi_atto_fk"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incarichi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "incarichi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "incarichi_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incarichi_intervento_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "persone"
            referencedColumns: ["id"]
          },
        ]
      }
      interventi: {
        Row: {
          annualita_programmazione: number | null
          codice_intervento: string
          created_at: string
          cup: string | null
          data_inserimento: string
          data_risoluzione: string | null
          descrizione: string | null
          edificio_id: string | null
          ente_id: string
          id: string
          importo_contrattuale: number
          importo_finanziato: number
          importo_programmato: number
          natura: Database["public"]["Enums"]["intervento_natura"]
          note: string | null
          note_risoluzione: string | null
          priorita: number | null
          risolto: boolean
          rup_id: string | null
          stato: Database["public"]["Enums"]["intervento_status"]
          tipologia_intervento_id: string | null
          titolo: string
          updated_at: string
        }
        Insert: {
          annualita_programmazione?: number | null
          codice_intervento: string
          created_at?: string
          cup?: string | null
          data_inserimento?: string
          data_risoluzione?: string | null
          descrizione?: string | null
          edificio_id?: string | null
          ente_id: string
          id?: string
          importo_contrattuale?: number
          importo_finanziato?: number
          importo_programmato?: number
          natura?: Database["public"]["Enums"]["intervento_natura"]
          note?: string | null
          note_risoluzione?: string | null
          priorita?: number | null
          risolto?: boolean
          rup_id?: string | null
          stato?: Database["public"]["Enums"]["intervento_status"]
          tipologia_intervento_id?: string | null
          titolo: string
          updated_at?: string
        }
        Update: {
          annualita_programmazione?: number | null
          codice_intervento?: string
          created_at?: string
          cup?: string | null
          data_inserimento?: string
          data_risoluzione?: string | null
          descrizione?: string | null
          edificio_id?: string | null
          ente_id?: string
          id?: string
          importo_contrattuale?: number
          importo_finanziato?: number
          importo_programmato?: number
          natura?: Database["public"]["Enums"]["intervento_natura"]
          note?: string | null
          note_risoluzione?: string | null
          priorita?: number | null
          risolto?: boolean
          rup_id?: string | null
          stato?: Database["public"]["Enums"]["intervento_status"]
          tipologia_intervento_id?: string | null
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "interventi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_rup_id_fkey"
            columns: ["rup_id"]
            isOneToOne: false
            referencedRelation: "persone"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_tipologia_intervento_id_fkey"
            columns: ["tipologia_intervento_id"]
            isOneToOne: false
            referencedRelation: "tipologie_intervento"
            referencedColumns: ["id"]
          },
        ]
      }
      interventi_edifici: {
        Row: {
          created_at: string
          edificio_id: string
          ente_id: string
          id: string
          intervento_id: string
        }
        Insert: {
          created_at?: string
          edificio_id: string
          ente_id: string
          id?: string
          intervento_id: string
        }
        Update: {
          created_at?: string
          edificio_id?: string
          ente_id?: string
          id?: string
          intervento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventi_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "interventi_edifici_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_edifici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "interventi_edifici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "interventi_edifici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      interventi_edifici_quote: {
        Row: {
          created_at: string
          criterio_attribuzione: string
          edificio_id: string
          ente_id: string
          id: string
          importo_attribuito: number | null
          intervento_id: string
          note: string | null
          percentuale: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterio_attribuzione?: string
          edificio_id: string
          ente_id: string
          id?: string
          importo_attribuito?: number | null
          intervento_id: string
          note?: string | null
          percentuale?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterio_attribuzione?: string
          edificio_id?: string
          ente_id?: string
          id?: string
          importo_attribuito?: number | null
          intervento_id?: string
          note?: string | null
          percentuale?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventi_edifici_quote_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_edifici_quote_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "interventi_edifici_quote_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_edifici_quote_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "interventi_edifici_quote_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "interventi_edifici_quote_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      manutenzione_documenti: {
        Row: {
          created_at: string
          created_by: string | null
          data_documento: string | null
          edificio_id: string
          ente_id: string
          id: string
          impianto_id: string | null
          manutenzione_id: string | null
          mime_type: string | null
          nome: string
          note: string | null
          size_bytes: number | null
          tipo: string | null
          updated_at: string
          url: string
          versione: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          edificio_id: string
          ente_id: string
          id?: string
          impianto_id?: string | null
          manutenzione_id?: string | null
          mime_type?: string | null
          nome: string
          note?: string | null
          size_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          url: string
          versione?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          edificio_id?: string
          ente_id?: string
          id?: string
          impianto_id?: string | null
          manutenzione_id?: string | null
          mime_type?: string | null
          nome?: string
          note?: string | null
          size_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          url?: string
          versione?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutenzione_documenti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzione_documenti_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzione_documenti_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "manutenzione_documenti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzione_documenti_impianto_id_fkey"
            columns: ["impianto_id"]
            isOneToOne: false
            referencedRelation: "impianti_manutentivi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzione_documenti_manutenzione_id_fkey"
            columns: ["manutenzione_id"]
            isOneToOne: false
            referencedRelation: "manutenzioni"
            referencedColumns: ["id"]
          },
        ]
      }
      manutenzioni: {
        Row: {
          costo_consuntivo: number
          costo_previsto: number
          created_at: string
          created_by: string | null
          data_esecuzione: string | null
          data_programmata: string | null
          data_richiesta: string
          descrizione: string
          edificio_id: string
          ente_id: string
          esito: string | null
          id: string
          impianto_id: string | null
          note: string | null
          numero_rapporto: string | null
          operatore: string | null
          stato: string
          tipo: string
          updated_at: string
        }
        Insert: {
          costo_consuntivo?: number
          costo_previsto?: number
          created_at?: string
          created_by?: string | null
          data_esecuzione?: string | null
          data_programmata?: string | null
          data_richiesta?: string
          descrizione: string
          edificio_id: string
          ente_id: string
          esito?: string | null
          id?: string
          impianto_id?: string | null
          note?: string | null
          numero_rapporto?: string | null
          operatore?: string | null
          stato?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          costo_consuntivo?: number
          costo_previsto?: number
          created_at?: string
          created_by?: string | null
          data_esecuzione?: string | null
          data_programmata?: string | null
          data_richiesta?: string
          descrizione?: string
          edificio_id?: string
          ente_id?: string
          esito?: string | null
          id?: string
          impianto_id?: string | null
          note?: string | null
          numero_rapporto?: string | null
          operatore?: string | null
          stato?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutenzioni_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzioni_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzioni_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "manutenzioni_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutenzioni_impianto_id_fkey"
            columns: ["impianto_id"]
            isOneToOne: false
            referencedRelation: "impianti_manutentivi"
            referencedColumns: ["id"]
          },
        ]
      }
      operatori_economici: {
        Row: {
          codice_fiscale: string | null
          email: string | null
          id: string
          note: string | null
          partita_iva: string | null
          pec: string | null
          ragione_sociale: string
          soa: string | null
          telefono: string | null
        }
        Insert: {
          codice_fiscale?: string | null
          email?: string | null
          id?: string
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          ragione_sociale: string
          soa?: string | null
          telefono?: string | null
        }
        Update: {
          codice_fiscale?: string | null
          email?: string | null
          id?: string
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          ragione_sociale?: string
          soa?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      pagamenti: {
        Row: {
          beneficiario: string | null
          contratto_id: string
          data_mandato: string | null
          id: string
          importo: number
          note: string | null
          numero_mandato: string | null
          sal_id: string | null
          stato: string | null
        }
        Insert: {
          beneficiario?: string | null
          contratto_id: string
          data_mandato?: string | null
          id?: string
          importo?: number
          note?: string | null
          numero_mandato?: string | null
          sal_id?: string | null
          stato?: string | null
        }
        Update: {
          beneficiario?: string | null
          contratto_id?: string
          data_mandato?: string | null
          id?: string
          importo?: number
          note?: string | null
          numero_mandato?: string | null
          sal_id?: string | null
          stato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamenti_contratto_id_fkey"
            columns: ["contratto_id"]
            isOneToOne: false
            referencedRelation: "contratti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamenti_sal_id_fkey"
            columns: ["sal_id"]
            isOneToOne: false
            referencedRelation: "sal"
            referencedColumns: ["id"]
          },
        ]
      }
      permessi_ruoli: {
        Row: {
          can_admin: boolean
          can_create: boolean
          can_delete: boolean
          can_documents: boolean
          can_update: boolean
          can_view: boolean
          created_at: string
          ente_id: string
          id: string
          risorsa: string
          ruolo: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id: string
          id?: string
          risorsa: string
          ruolo: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id?: string
          id?: string
          risorsa?: string
          ruolo?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permessi_ruoli_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      permessi_utenti: {
        Row: {
          can_admin: boolean
          can_create: boolean
          can_delete: boolean
          can_documents: boolean
          can_update: boolean
          can_view: boolean
          created_at: string
          ente_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permessi_utenti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permessi_utenti_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permessi_utenti_risorse: {
        Row: {
          can_admin: boolean
          can_create: boolean
          can_delete: boolean
          can_documents: boolean
          can_update: boolean
          can_view: boolean
          created_at: string
          ente_id: string
          id: string
          risorsa: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id: string
          id?: string
          risorsa: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_admin?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_documents?: boolean
          can_update?: boolean
          can_view?: boolean
          created_at?: string
          ente_id?: string
          id?: string
          risorsa?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permessi_utenti_risorse_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      persone: {
        Row: {
          codice_fiscale: string | null
          cognome: string
          created_at: string
          email: string | null
          id: string
          nome: string
          numero_iscrizione: string | null
          ordine_professionale: string | null
          qualifica: string | null
          telefono: string | null
        }
        Insert: {
          codice_fiscale?: string | null
          cognome: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          numero_iscrizione?: string | null
          ordine_professionale?: string | null
          qualifica?: string | null
          telefono?: string | null
        }
        Update: {
          codice_fiscale?: string | null
          cognome?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          numero_iscrizione?: string | null
          ordine_professionale?: string | null
          qualifica?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      procedure_affidamento: {
        Row: {
          cig: string | null
          cup: string | null
          data_aggiudicazione: string | null
          data_avvio: string | null
          id: string
          importo_aggiudicazione: number | null
          importo_base: number | null
          intervento_id: string
          note: string | null
          piattaforma: string | null
          stato: string | null
          tipo_procedura: string | null
        }
        Insert: {
          cig?: string | null
          cup?: string | null
          data_aggiudicazione?: string | null
          data_avvio?: string | null
          id?: string
          importo_aggiudicazione?: number | null
          importo_base?: number | null
          intervento_id: string
          note?: string | null
          piattaforma?: string | null
          stato?: string | null
          tipo_procedura?: string | null
        }
        Update: {
          cig?: string | null
          cup?: string | null
          data_aggiudicazione?: string | null
          data_avvio?: string | null
          id?: string
          importo_aggiudicazione?: number | null
          importo_base?: number | null
          intervento_id?: string
          note?: string | null
          piattaforma?: string | null
          stato?: string | null
          tipo_procedura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_affidamento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "procedure_affidamento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "procedure_affidamento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_operatori: {
        Row: {
          operatore_id: string
          procedura_id: string
          ruolo: string | null
        }
        Insert: {
          operatore_id: string
          procedura_id: string
          ruolo?: string | null
        }
        Update: {
          operatore_id?: string
          procedura_id?: string
          ruolo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_operatori_operatore_id_fkey"
            columns: ["operatore_id"]
            isOneToOne: false
            referencedRelation: "operatori_economici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_operatori_procedura_id_fkey"
            columns: ["procedura_id"]
            isOneToOne: false
            referencedRelation: "procedure_affidamento"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          attivo: boolean
          cognome: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          cognome?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          cognome?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progetti: {
        Row: {
          atto_approvazione_id: string | null
          data_approvazione: string | null
          data_redazione: string | null
          id: string
          importo_lavori: number | null
          importo_quadro_economico: number | null
          intervento_id: string
          livello: Database["public"]["Enums"]["progetto_livello"]
          note: string | null
          professionista_id: string | null
          stato: string | null
          versione: number
        }
        Insert: {
          atto_approvazione_id?: string | null
          data_approvazione?: string | null
          data_redazione?: string | null
          id?: string
          importo_lavori?: number | null
          importo_quadro_economico?: number | null
          intervento_id: string
          livello: Database["public"]["Enums"]["progetto_livello"]
          note?: string | null
          professionista_id?: string | null
          stato?: string | null
          versione?: number
        }
        Update: {
          atto_approvazione_id?: string | null
          data_approvazione?: string | null
          data_redazione?: string | null
          id?: string
          importo_lavori?: number | null
          importo_quadro_economico?: number | null
          intervento_id?: string
          livello?: Database["public"]["Enums"]["progetto_livello"]
          note?: string | null
          professionista_id?: string | null
          stato?: string | null
          versione?: number
        }
        Relationships: [
          {
            foreignKeyName: "progetti_atto_fk"
            columns: ["atto_approvazione_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progetti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "progetti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "progetti_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progetti_professionista_id_fkey"
            columns: ["professionista_id"]
            isOneToOne: false
            referencedRelation: "persone"
            referencedColumns: ["id"]
          },
        ]
      }
      programmazione_interventi: {
        Row: {
          annualita: number | null
          id: string
          importo_previsto: number | null
          intervento_id: string
          priorita: number | null
          programmazione_id: string
        }
        Insert: {
          annualita?: number | null
          id?: string
          importo_previsto?: number | null
          intervento_id: string
          priorita?: number | null
          programmazione_id: string
        }
        Update: {
          annualita?: number | null
          id?: string
          importo_previsto?: number | null
          intervento_id?: string
          priorita?: number | null
          programmazione_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmazione_interventi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "programmazione_interventi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "programmazione_interventi_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmazione_interventi_programmazione_id_fkey"
            columns: ["programmazione_id"]
            isOneToOne: false
            referencedRelation: "programmazioni"
            referencedColumns: ["id"]
          },
        ]
      }
      programmazioni: {
        Row: {
          anno: number
          atto_approvazione_id: string | null
          data_approvazione: string | null
          ente_id: string
          id: string
          note: string | null
          stato: string | null
          tipo_programmazione: string
        }
        Insert: {
          anno: number
          atto_approvazione_id?: string | null
          data_approvazione?: string | null
          ente_id: string
          id?: string
          note?: string | null
          stato?: string | null
          tipo_programmazione: string
        }
        Update: {
          anno?: number
          atto_approvazione_id?: string | null
          data_approvazione?: string | null
          ente_id?: string
          id?: string
          note?: string | null
          stato?: string | null
          tipo_programmazione?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmazioni_atto_fk"
            columns: ["atto_approvazione_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmazioni_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      quadri_economici: {
        Row: {
          data_validita: string
          id: string
          importo_totale: number
          intervento_id: string
          note: string | null
          progetto_id: string | null
          stato: string | null
          versione: number
        }
        Insert: {
          data_validita?: string
          id?: string
          importo_totale?: number
          intervento_id: string
          note?: string | null
          progetto_id?: string | null
          stato?: string | null
          versione?: number
        }
        Update: {
          data_validita?: string
          id?: string
          importo_totale?: number
          intervento_id?: string
          note?: string | null
          progetto_id?: string | null
          stato?: string | null
          versione?: number
        }
        Relationships: [
          {
            foreignKeyName: "quadri_economici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "quadri_economici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "quadri_economici_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quadri_economici_progetto_id_fkey"
            columns: ["progetto_id"]
            isOneToOne: false
            referencedRelation: "progetti"
            referencedColumns: ["id"]
          },
        ]
      }
      richiesta_intervento_documenti: {
        Row: {
          created_at: string
          created_by: string | null
          data_documento: string | null
          ente_id: string
          hash_file: string | null
          id: string
          mime_type: string | null
          nome: string
          note: string | null
          richiesta_id: string
          size_bytes: number | null
          tipo: string | null
          updated_at: string
          url: string
          versione: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          ente_id: string
          hash_file?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          note?: string | null
          richiesta_id: string
          size_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          url: string
          versione?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_documento?: string | null
          ente_id?: string
          hash_file?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          note?: string | null
          richiesta_id?: string
          size_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          url?: string
          versione?: number
        }
        Relationships: [
          {
            foreignKeyName: "richiesta_intervento_documenti_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richiesta_intervento_documenti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richiesta_intervento_documenti_richiesta_ente_fkey"
            columns: ["richiesta_id", "ente_id"]
            isOneToOne: false
            referencedRelation: "richieste_intervento"
            referencedColumns: ["id", "ente_id"]
          },
        ]
      }
      richieste_import_chunks: {
        Row: {
          id: number
          payload: string
        }
        Insert: {
          id: number
          payload: string
        }
        Update: {
          id?: number
          payload?: string
        }
        Relationships: []
      }
      richieste_intervento: {
        Row: {
          allegati_presenti: boolean
          codice_identificativo_locale: string | null
          codice_richiesta: string | null
          created_at: string
          created_by: string | null
          data_protocollo: string | null
          data_richiesta: string
          data_risoluzione: string | null
          descrizione_estesa: string
          edificio_origine: string | null
          ente_id: string
          id: string
          note_immobile: string | null
          note_risoluzione: string | null
          numero_progressivo: number
          numero_protocollo: string | null
          origine_sistema: string
          priorita: string | null
          risolto: boolean
          stato_risoluzione: string
          tipo_intervento: string
          titolo_sintetico: string
          updated_at: string
        }
        Insert: {
          allegati_presenti?: boolean
          codice_identificativo_locale?: string | null
          codice_richiesta?: string | null
          created_at?: string
          created_by?: string | null
          data_protocollo?: string | null
          data_richiesta?: string
          data_risoluzione?: string | null
          descrizione_estesa: string
          edificio_origine?: string | null
          ente_id: string
          id?: string
          note_immobile?: string | null
          note_risoluzione?: string | null
          numero_progressivo?: never
          numero_protocollo?: string | null
          origine_sistema?: string
          priorita?: string | null
          risolto?: boolean
          stato_risoluzione?: string
          tipo_intervento?: string
          titolo_sintetico: string
          updated_at?: string
        }
        Update: {
          allegati_presenti?: boolean
          codice_identificativo_locale?: string | null
          codice_richiesta?: string | null
          created_at?: string
          created_by?: string | null
          data_protocollo?: string | null
          data_richiesta?: string
          data_risoluzione?: string | null
          descrizione_estesa?: string
          edificio_origine?: string | null
          ente_id?: string
          id?: string
          note_immobile?: string | null
          note_risoluzione?: string | null
          numero_progressivo?: never
          numero_protocollo?: string | null
          origine_sistema?: string
          priorita?: string | null
          risolto?: boolean
          stato_risoluzione?: string
          tipo_intervento?: string
          titolo_sintetico?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "richieste_intervento_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richieste_intervento_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      richieste_intervento_allegati: {
        Row: {
          created_at: string
          created_by: string
          dimensione_bytes: number
          id: string
          mime_type: string
          nome_file: string
          richiesta_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dimensione_bytes: number
          id?: string
          mime_type: string
          nome_file: string
          richiesta_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dimensione_bytes?: number
          id?: string
          mime_type?: string
          nome_file?: string
          richiesta_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "richieste_intervento_allegati_richiesta_id_fkey"
            columns: ["richiesta_id"]
            isOneToOne: false
            referencedRelation: "richieste_intervento"
            referencedColumns: ["id"]
          },
        ]
      }
      richieste_intervento_ambiti: {
        Row: {
          ambito_id: string
          created_at: string
          ente_id: string
          id: string
          richiesta_id: string
        }
        Insert: {
          ambito_id: string
          created_at?: string
          ente_id: string
          id?: string
          richiesta_id: string
        }
        Update: {
          ambito_id?: string
          created_at?: string
          ente_id?: string
          id?: string
          richiesta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "richieste_intervento_ambiti_ambito_id_fkey"
            columns: ["ambito_id"]
            isOneToOne: false
            referencedRelation: "ambiti_richiesta_intervento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richieste_intervento_ambiti_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richieste_intervento_ambiti_richiesta_ente_fkey"
            columns: ["richiesta_id", "ente_id"]
            isOneToOne: false
            referencedRelation: "richieste_intervento"
            referencedColumns: ["id", "ente_id"]
          },
        ]
      }
      richieste_intervento_sedi: {
        Row: {
          created_at: string
          edificio_id: string
          ente_id: string
          id: string
          richiesta_id: string
        }
        Insert: {
          created_at?: string
          edificio_id: string
          ente_id: string
          id?: string
          richiesta_id: string
        }
        Update: {
          created_at?: string
          edificio_id?: string
          ente_id?: string
          id?: string
          richiesta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "richieste_intervento_sedi_edificio_ente_fkey"
            columns: ["edificio_id", "ente_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id", "ente_id"]
          },
          {
            foreignKeyName: "richieste_intervento_sedi_edificio_ente_fkey"
            columns: ["edificio_id", "ente_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id", "ente_id"]
          },
          {
            foreignKeyName: "richieste_intervento_sedi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "richieste_intervento_sedi_richiesta_ente_fkey"
            columns: ["richiesta_id", "ente_id"]
            isOneToOne: false
            referencedRelation: "richieste_intervento"
            referencedColumns: ["id", "ente_id"]
          },
        ]
      }
      sal: {
        Row: {
          atto_id: string | null
          contratto_id: string
          data_approvazione: string | null
          data_emissione: string | null
          id: string
          importo_certificato: number | null
          importo_lavori: number | null
          importo_sicurezza: number | null
          numero_sal: number
          periodo_a: string | null
          periodo_da: string | null
        }
        Insert: {
          atto_id?: string | null
          contratto_id: string
          data_approvazione?: string | null
          data_emissione?: string | null
          id?: string
          importo_certificato?: number | null
          importo_lavori?: number | null
          importo_sicurezza?: number | null
          numero_sal: number
          periodo_a?: string | null
          periodo_da?: string | null
        }
        Update: {
          atto_id?: string | null
          contratto_id?: string
          data_approvazione?: string | null
          data_emissione?: string | null
          id?: string
          importo_certificato?: number | null
          importo_lavori?: number | null
          importo_sicurezza?: number | null
          numero_sal?: number
          periodo_a?: string | null
          periodo_da?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sal_atto_fk"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sal_contratto_id_fkey"
            columns: ["contratto_id"]
            isOneToOne: false
            referencedRelation: "contratti"
            referencedColumns: ["id"]
          },
        ]
      }
      scuola_access_log: {
        Row: {
          azione: string
          edificio_id: string | null
          ente_id: string
          id: number
          metadata: Json
          richiesta_id: string | null
          scuola_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          azione: string
          edificio_id?: string | null
          ente_id: string
          id?: never
          metadata?: Json
          richiesta_id?: string | null
          scuola_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          azione?: string
          edificio_id?: string | null
          ente_id?: string
          id?: never
          metadata?: Json
          richiesta_id?: string | null
          scuola_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scuola_access_log_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scuola_access_log_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "scuola_access_log_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scuola_access_log_richiesta_id_fkey"
            columns: ["richiesta_id"]
            isOneToOne: false
            referencedRelation: "richieste_intervento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scuola_access_log_scuola_id_fkey"
            columns: ["scuola_id"]
            isOneToOne: false
            referencedRelation: "scuole"
            referencedColumns: ["id"]
          },
        ]
      }
      scuola_utenti: {
        Row: {
          attivo: boolean
          created_at: string
          data_fine: string | null
          data_inizio: string
          id: string
          ruolo: Database["public"]["Enums"]["app_role"]
          scuola_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          data_fine?: string | null
          data_inizio?: string
          id?: string
          ruolo: Database["public"]["Enums"]["app_role"]
          scuola_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          data_fine?: string | null
          data_inizio?: string
          id?: string
          ruolo?: Database["public"]["Enums"]["app_role"]
          scuola_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scuola_utenti_scuola_id_fkey"
            columns: ["scuola_id"]
            isOneToOne: false
            referencedRelation: "scuole"
            referencedColumns: ["id"]
          },
        ]
      }
      scuola_utenti_edifici: {
        Row: {
          attivo: boolean
          created_at: string
          data_fine: string | null
          data_inizio: string
          edificio_id: string
          id: string
          scuola_utente_id: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          data_fine?: string | null
          data_inizio?: string
          edificio_id: string
          id?: string
          scuola_utente_id: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          data_fine?: string | null
          data_inizio?: string
          edificio_id?: string
          id?: string
          scuola_utente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scuola_utenti_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scuola_utenti_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "scuola_utenti_edifici_scuola_utente_id_fkey"
            columns: ["scuola_utente_id"]
            isOneToOne: false
            referencedRelation: "scuola_utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      scuole: {
        Row: {
          attiva: boolean
          codice_meccanografico: string | null
          created_at: string
          denominazione: string
          dirigente_user_id: string | null
          ente_id: string
          id: string
          updated_at: string
        }
        Insert: {
          attiva?: boolean
          codice_meccanografico?: string | null
          created_at?: string
          denominazione: string
          dirigente_user_id?: string | null
          ente_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          attiva?: boolean
          codice_meccanografico?: string | null
          created_at?: string
          denominazione?: string
          dirigente_user_id?: string | null
          ente_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scuole_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      scuole_edifici: {
        Row: {
          attivo: boolean
          created_at: string
          edificio_id: string
          id: string
          scuola_id: string
        }
        Insert: {
          attivo?: boolean
          created_at?: string
          edificio_id: string
          id?: string
          scuola_id: string
        }
        Update: {
          attivo?: boolean
          created_at?: string
          edificio_id?: string
          id?: string
          scuola_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scuole_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edifici"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scuole_edifici_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "v_fascicoli_edifici"
            referencedColumns: ["edificio_id"]
          },
          {
            foreignKeyName: "scuole_edifici_scuola_id_fkey"
            columns: ["scuola_id"]
            isOneToOne: false
            referencedRelation: "scuole"
            referencedColumns: ["id"]
          },
        ]
      }
      tipologie_documenti_immobile: {
        Row: {
          attivo: boolean
          categoria: string
          codice: string
          created_at: string
          denominazione: string
          id: string
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          categoria: string
          codice: string
          created_at?: string
          denominazione: string
          id?: string
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          categoria?: string
          codice?: string
          created_at?: string
          denominazione?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipologie_impianto: {
        Row: {
          attivo: boolean
          categoria: string
          codice: string
          colore: string | null
          created_at: string
          denominazione: string
          descrizione: string | null
          ente_id: string
          gestione_alert: boolean
          gestione_documenti: boolean
          gestione_manutenzione: boolean
          gestione_scadenze: boolean
          icona: string | null
          id: string
          ordinamento: number
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          categoria?: string
          codice: string
          colore?: string | null
          created_at?: string
          denominazione: string
          descrizione?: string | null
          ente_id: string
          gestione_alert?: boolean
          gestione_documenti?: boolean
          gestione_manutenzione?: boolean
          gestione_scadenze?: boolean
          icona?: string | null
          id?: string
          ordinamento?: number
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          categoria?: string
          codice?: string
          colore?: string | null
          created_at?: string
          denominazione?: string
          descrizione?: string | null
          ente_id?: string
          gestione_alert?: boolean
          gestione_documenti?: boolean
          gestione_manutenzione?: boolean
          gestione_scadenze?: boolean
          icona?: string | null
          id?: string
          ordinamento?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipologie_impianto_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      tipologie_intervento: {
        Row: {
          attivo: boolean
          codice: string
          denominazione: string
          id: string
        }
        Insert: {
          attivo?: boolean
          codice: string
          denominazione: string
          id?: string
        }
        Update: {
          attivo?: boolean
          codice?: string
          denominazione?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          ente_id: string
          ruolo: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          ente_id: string
          ruolo: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          ente_id?: string
          ruolo?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      valori_attributi_impianto: {
        Row: {
          attributo_id: string
          created_at: string
          id: string
          impianto_id: string
          updated_at: string
          valore: string | null
        }
        Insert: {
          attributo_id: string
          created_at?: string
          id?: string
          impianto_id: string
          updated_at?: string
          valore?: string | null
        }
        Update: {
          attributo_id?: string
          created_at?: string
          id?: string
          impianto_id?: string
          updated_at?: string
          valore?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valori_attributi_impianto_attributo_id_fkey"
            columns: ["attributo_id"]
            isOneToOne: false
            referencedRelation: "attributi_tipologia_impianto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valori_attributi_impianto_impianto_id_fkey"
            columns: ["impianto_id"]
            isOneToOne: false
            referencedRelation: "impianti_manutentivi"
            referencedColumns: ["id"]
          },
        ]
      }
      varianti: {
        Row: {
          atto_id: string | null
          contratto_id: string
          data_approvazione: string | null
          id: string
          importo_nuovo: number | null
          importo_precedente: number | null
          motivazione: string | null
          numero: number
          variazione: number | null
        }
        Insert: {
          atto_id?: string | null
          contratto_id: string
          data_approvazione?: string | null
          id?: string
          importo_nuovo?: number | null
          importo_precedente?: number | null
          motivazione?: string | null
          numero: number
          variazione?: number | null
        }
        Update: {
          atto_id?: string | null
          contratto_id?: string
          data_approvazione?: string | null
          id?: string
          importo_nuovo?: number | null
          importo_precedente?: number | null
          motivazione?: string | null
          numero?: number
          variazione?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "varianti_atto_fk"
            columns: ["atto_id"]
            isOneToOne: false
            referencedRelation: "atti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "varianti_contratto_id_fkey"
            columns: ["contratto_id"]
            isOneToOne: false
            referencedRelation: "contratti"
            referencedColumns: ["id"]
          },
        ]
      }
      voci_quadro_economico: {
        Row: {
          categoria: string
          codice: string | null
          descrizione: string
          id: string
          importo: number
          quadro_economico_id: string
        }
        Insert: {
          categoria: string
          codice?: string | null
          descrizione: string
          id?: string
          importo?: number
          quadro_economico_id: string
        }
        Update: {
          categoria?: string
          codice?: string | null
          descrizione?: string
          id?: string
          importo?: number
          quadro_economico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voci_quadro_economico_quadro_economico_id_fkey"
            columns: ["quadro_economico_id"]
            isOneToOne: false
            referencedRelation: "quadri_economici"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_avanzamento: {
        Row: {
          avanzamento: number | null
          codice_intervento: string | null
          ente_id: string | null
          intervento_id: string | null
          prossima_scadenza: string | null
          stato: Database["public"]["Enums"]["intervento_status"] | null
          titolo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_demo: {
        Row: {
          conclusi: number | null
          edifici: number | null
          importo_finanziato: number | null
          importo_programmato: number | null
          in_progettazione: number | null
          interventi: number | null
        }
        Relationships: []
      }
      dashboard_finanziamenti: {
        Row: {
          codice: string | null
          denominazione: string | null
          ente_id: string | null
          importo: number | null
          intervento_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_avanzamento"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ritardi"
            referencedColumns: ["intervento_id"]
          },
          {
            foreignKeyName: "finanziamenti_intervento_intervento_id_fkey"
            columns: ["intervento_id"]
            isOneToOne: false
            referencedRelation: "interventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_interventi: {
        Row: {
          ente_id: string | null
          importo_contrattuale: number | null
          importo_finanziato: number | null
          importo_programmato: number | null
          interventi_attivi: number | null
          interventi_conclusi: number | null
          interventi_sospesi: number | null
          interventi_totali: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interventi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_ritardi: {
        Row: {
          codice_intervento: string | null
          data_prevista_fine: string | null
          ente_id: string | null
          fase: Database["public"]["Enums"]["fase_tipo"] | null
          giorni_ritardo: number | null
          intervento_id: string | null
          titolo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventi_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      my_access: {
        Row: {
          ente: string | null
          ente_id: string | null
          ruolo: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_fascicoli_edifici: {
        Row: {
          edificio_id: string | null
          ente_id: string | null
          impianti: number | null
          interventi: number | null
          manutenzioni: number | null
          richieste: number | null
          richieste_annullate: number | null
          richieste_aperte: number | null
          richieste_chiuse: number | null
        }
        Insert: {
          edificio_id?: string | null
          ente_id?: string | null
          impianti?: never
          interventi?: never
          manutenzioni?: never
          richieste?: never
          richieste_annullate?: never
          richieste_aperte?: never
          richieste_chiuse?: never
        }
        Update: {
          edificio_id?: string | null
          ente_id?: string | null
          impianti?: never
          interventi?: never
          manutenzioni?: never
          richieste?: never
          richieste_annullate?: never
          richieste_aperte?: never
          richieste_chiuse?: never
        }
        Relationships: [
          {
            foreignKeyName: "edifici_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_ente: { Args: { p_ente_id: string }; Returns: boolean }
      can_manage_edificio: {
        Args: { p_action?: string; p_edificio_id: string }
        Returns: boolean
      }
      can_manage_user_role: {
        Args: {
          p_ente_id: string
          p_ruolo: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          p_ente?: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      import_impianti_termici_batch: {
        Args: { p_batch_id: string }
        Returns: number
      }
      import_intervento_sharepoint: {
        Args: { p_data: Json; p_ente_id: string }
        Returns: Json
      }
      is_school_portal_user: { Args: { p_user_id?: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      school_cancel_request: {
        Args: { p_motivazione: string; p_request_id: string }
        Returns: boolean
      }
      school_create_request: {
        Args: {
          p_descrizione: string
          p_edificio_id: string
          p_ente_id: string
          p_note_immobile?: string
          p_priorita?: string
          p_tipo_intervento?: string
          p_titolo: string
        }
        Returns: string
      }
      school_create_request_multi: {
        Args: {
          p_descrizione: string
          p_edificio_ids: string[]
          p_ente_id: string
          p_note_immobile?: string
          p_priorita?: string
          p_tipo_intervento?: string
          p_titolo: string
        }
        Returns: string
      }
      school_create_request_multi_school: {
        Args: {
          p_descrizione: string
          p_edificio_ids: string[]
          p_ente_id: string
          p_note_immobile?: string
          p_priorita?: string
          p_scuola_id: string
          p_tipo_intervento?: string
          p_titolo: string
        }
        Returns: string
      }
      school_mark_request_attachments: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      school_user_has_building: {
        Args: { p_building_id: string; p_user_id: string }
        Returns: boolean
      }
      school_user_has_request: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin_ente"
        | "rup"
        | "tecnico"
        | "amministrativo"
        | "direttore_lavori"
        | "auditor"
        | "consultatore"
        | "manutentore"
        | "siservizi"
        | "dirigente_scolastico"
        | "delegato_scolastico"
      atto_tipo:
        | "determina"
        | "delibera"
        | "decreto"
        | "verbale"
        | "atto_approvazione"
        | "atto_validazione"
        | "contratto"
        | "altro"
      documento_tipo:
        | "progetto"
        | "atto"
        | "verbale"
        | "contratto"
        | "sal"
        | "pagamento"
        | "collaudo"
        | "cre"
        | "foto"
        | "altro"
      fase_tipo:
        | "programmazione"
        | "pfte"
        | "verifica_pfte"
        | "approvazione_pfte"
        | "esecutivo"
        | "verifica_esecutivo"
        | "validazione"
        | "approvazione"
        | "affidamento"
        | "contratto"
        | "consegna"
        | "esecuzione"
        | "sal"
        | "fine_lavori"
        | "collaudo"
        | "cre"
        | "chiusura"
      intervento_natura: "LAVORO" | "SERVIZIO"
      intervento_status:
        | "programmato"
        | "progettazione"
        | "approvato"
        | "affidamento"
        | "contratto"
        | "esecuzione"
        | "fine_lavori"
        | "collaudo"
        | "chiuso"
        | "sospeso"
        | "annullato"
      progetto_livello:
        | "in_programmazione"
        | "programmato"
        | "dip"
        | "pfte"
        | "esecutivo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "superadmin",
        "admin_ente",
        "rup",
        "tecnico",
        "amministrativo",
        "direttore_lavori",
        "auditor",
        "consultatore",
        "manutentore",
        "siservizi",
        "dirigente_scolastico",
        "delegato_scolastico",
      ],
      atto_tipo: [
        "determina",
        "delibera",
        "decreto",
        "verbale",
        "atto_approvazione",
        "atto_validazione",
        "contratto",
        "altro",
      ],
      documento_tipo: [
        "progetto",
        "atto",
        "verbale",
        "contratto",
        "sal",
        "pagamento",
        "collaudo",
        "cre",
        "foto",
        "altro",
      ],
      fase_tipo: [
        "programmazione",
        "pfte",
        "verifica_pfte",
        "approvazione_pfte",
        "esecutivo",
        "verifica_esecutivo",
        "validazione",
        "approvazione",
        "affidamento",
        "contratto",
        "consegna",
        "esecuzione",
        "sal",
        "fine_lavori",
        "collaudo",
        "cre",
        "chiusura",
      ],
      intervento_natura: ["LAVORO", "SERVIZIO"],
      intervento_status: [
        "programmato",
        "progettazione",
        "approvato",
        "affidamento",
        "contratto",
        "esecuzione",
        "fine_lavori",
        "collaudo",
        "chiuso",
        "sospeso",
        "annullato",
      ],
      progetto_livello: [
        "in_programmazione",
        "programmato",
        "dip",
        "pfte",
        "esecutivo",
      ],
    },
  },
} as const
