
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
