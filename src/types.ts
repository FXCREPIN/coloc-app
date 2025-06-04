export interface Transaction {
  id: string;
  type: 'depense' | 'cotisation';
  colocataire: string;
  date: string;
  description: string;
  montant: number;
}

export interface MonthData {
  month: string;
  year: number;
  transactions: Transaction[];
  isClosed?: boolean;
  closedColocataires?: Colocataire[];
  remboursements?: Array<{
    id: string;
    colocataire: string;
    montant: number;
    destinataire: string;
    raison: string;
  }>;
  remarques?: string;
}

export interface Colocataire {
  id?: string;
  nom: string;
  creditManuel?: number;
  email?: string;
  cotisationMensuelle?: number;
  dateAjout?: string;
  type?: 'volontaire' | 'accueilli';
  responsableCourses?: boolean;
}

export type RemboursementRule = 'egal' | 'priorisation';

export interface RemboursementSettings {
  regle: RemboursementRule;
  budgetInitial?: number;
} 