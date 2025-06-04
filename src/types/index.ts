export interface Transaction {
  id: string;
  type: 'cotisation' | 'depense';
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
  closedColocataires?: Colocataire[]; // Snapshot des colocataires au moment de la clôture
  remarques?: string; // Champ pour les remarques du mois
  isTransactionsVisible?: boolean; // État d'affichage des transactions
}

export interface ColocataireBalance {
  nom: string;
  cotisations: number;
  depenses: number;
  solde: number;
}

export interface MonthSummary {
  totalCotisations: number;
  totalDepenses: number;
  soldeGlobal: number;
  balances: ColocataireBalance[];
}

export type ColocataireType = 'accueilli' | 'volontaire';
export type RemboursementRule = 'egal' | 'egal-accueillis' | 'priorisation';

export interface Colocataire {
  id: string;
  nom: string;
  cotisationMensuelle: number;
  dateAjout: string;
  type: ColocataireType;
  creditManuel: number;
  responsableCourses: boolean;
  prioriteRemboursement?: number; // 1 = plus prioritaire
}

export interface RemboursementSettings {
  regle: RemboursementRule;
  budgetInitial?: number;
}
