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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
      audit_log: {
        Row: {
          azione: string
          ente_id: string | null
          id: number
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
        ]
      }
      documenti: {
        Row: {
          atto_id: string | null
          created_at: string
          data_documento: string | null
          firmato_digitalmente: boolean | null
          formato: string | null
          hash_file: string | null
          id: string
          intervento_id: string | null
          nome: string
          note: string | null
          progetto_id: string | null
          tipo: Database["public"]["Enums"]["documento_tipo"]
          url: string | null
          versione: number | null
        }
        Insert: {
          atto_id?: string | null
          created_at?: string
          data_documento?: string | null
          firmato_digitalmente?: boolean | null
          formato?: string | null
          hash_file?: string | null
          id?: string
          intervento_id?: string | null
          nome: string
          note?: string | null
          progetto_id?: string | null
          tipo: Database["public"]["Enums"]["documento_tipo"]
          url?: string | null
          versione?: number | null
        }
        Update: {
          atto_id?: string | null
          created_at?: string
          data_documento?: string | null
          firmato_digitalmente?: boolean | null
          formato?: string | null
          hash_file?: string | null
          id?: string
          intervento_id?: string | null
          nome?: string
          note?: string | null
          progetto_id?: string | null
          tipo?: Database["public"]["Enums"]["documento_tipo"]
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
      edifici: {
        Row: {
          anno_adeguamento: number | null
          anno_costruzione: number | null
          cap: string | null
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
          pec?: string | null
          telefono?: string | null
          tipo_ente?: string | null
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
          descrizione: string | null
          edificio_id: string
          ente_id: string
          id: string
          importo_contrattuale: number
          importo_finanziato: number
          importo_programmato: number
          note: string | null
          priorita: number | null
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
          descrizione?: string | null
          edificio_id: string
          ente_id: string
          id?: string
          importo_contrattuale?: number
          importo_finanziato?: number
          importo_programmato?: number
          note?: string | null
          priorita?: number | null
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
          descrizione?: string | null
          edificio_id?: string
          ente_id?: string
          id?: string
          importo_contrattuale?: number
          importo_finanziato?: number
          importo_programmato?: number
          note?: string | null
          priorita?: number | null
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
    }
    Functions: {
      can_access_ente: { Args: { p_ente_id: string }; Returns: boolean }
      has_role: {
        Args: {
          p_ente?: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
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
      progetto_livello: "pfte" | "esecutivo"
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
      progetto_livello: ["pfte", "esecutivo"],
    },
  },
} as const


/** Fascicolo immobile - estensione applicativa */
export interface TipologiaDocumentoImmobile {
  id: string
  codice: string
  denominazione: string
  categoria: string
  attivo: boolean
  created_at: string
  updated_at: string
}
export interface DocumentoImmobile {
  id: string
  ente_id: string
  edificio_id: string
  tipologia_id: string
  impianto_id: string | null
  titolo: string
  numero: string | null
  protocollo: string | null
  data_documento: string | null
  data_emissione: string | null
  data_scadenza: string | null
  periodicita_mesi: number | null
  data_prossima_verifica: string | null
  emittente: string | null
  tecnico: string | null
  ditta: string | null
  stato: 'valido' | 'in_scadenza' | 'scaduto' | 'da_verificare' | 'archiviato'
  nome_file: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  versione: string | null
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
