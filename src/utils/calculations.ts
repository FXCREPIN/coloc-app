
import { Transaction, ColocataireBalance, MonthSummary } from '@/types';

export const calculateMonthSummary = (transactions: Transaction[]): MonthSummary => {
  const colocataires = Array.from(new Set(transactions.map(t => t.colocataire)));
  
  const totalCotisations = transactions
    .filter(t => t.type === 'cotisation')
    .reduce((sum, t) => sum + t.montant, 0);
  
  const totalDepenses = transactions
    .filter(t => t.type === 'depense')
    .reduce((sum, t) => sum + t.montant, 0);
  
  const balances: ColocataireBalance[] = colocataires.map(nom => {
    const cotisations = transactions
      .filter(t => t.colocataire === nom && t.type === 'cotisation')
      .reduce((sum, t) => sum + t.montant, 0);
    
    const depenses = transactions
      .filter(t => t.colocataire === nom && t.type === 'depense')
      .reduce((sum, t) => sum + t.montant, 0);
    
    return {
      nom,
      cotisations,
      depenses,
      solde: cotisations - depenses
    };
  });
  
  return {
    totalCotisations,
    totalDepenses,
    soldeGlobal: totalCotisations - totalDepenses,
    balances
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
