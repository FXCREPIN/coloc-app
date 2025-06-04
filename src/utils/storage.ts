import { MonthData, Transaction, Colocataire, RemboursementRule, RemboursementSettings } from '@/types';

const STORAGE_KEY = 'colocation-accounts';
const COLOCATAIRES_KEY = 'colocation-colocataires';
const REMBOURSEMENT_SETTINGS_KEY = 'colocation-remboursement';

// Données de démonstration
const demoData: MonthData[] = [
  {
    month: 'Mars',
    year: 2025,
    transactions: [
      {
        id: '1',
        type: 'cotisation',
        colocataire: 'Alice',
        date: '2025-03-01',
        description: 'Cotisation mensuelle',
        montant: 200
      },
      {
        id: '2',
        type: 'cotisation',
        colocataire: 'Bob',
        date: '2025-03-01',
        description: 'Cotisation mensuelle',
        montant: 200
      },
      {
        id: '3',
        type: 'cotisation',
        colocataire: 'Charlie',
        date: '2025-03-01',
        description: 'Cotisation mensuelle',
        montant: 200
      },
      {
        id: '4',
        type: 'depense',
        colocataire: 'Alice',
        date: '2025-03-05',
        description: 'Courses Carrefour',
        montant: 85.50
      },
      {
        id: '5',
        type: 'depense',
        colocataire: 'Bob',
        date: '2025-03-10',
        description: 'Internet/Électricité',
        montant: 120
      },
      {
        id: '6',
        type: 'depense',
        colocataire: 'Charlie',
        date: '2025-03-15',
        description: 'Produits ménagers',
        montant: 45.80
      }
    ]
  },
  {
    month: 'Avril',
    year: 2025,
    transactions: [
      {
        id: '7',
        type: 'cotisation',
        colocataire: 'Alice',
        date: '2025-04-01',
        description: 'Cotisation mensuelle',
        montant: 200
      },
      {
        id: '8',
        type: 'cotisation',
        colocataire: 'Bob',
        date: '2025-04-01',
        description: 'Cotisation mensuelle',
        montant: 200
      },
      {
        id: '9',
        type: 'depense',
        colocataire: 'Alice',
        date: '2025-04-08',
        description: 'Courses Monoprix',
        montant: 92.30
      }
    ]
  }
];

export const loadData = (): MonthData[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialiser avec les données de démo
  saveData(demoData);
  return demoData;
};

export const saveData = (data: MonthData[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addTransaction = (monthKey: string, transactionData: Omit<Transaction, 'id'>): void => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  
  let monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  if (!monthData) {
    monthData = {
      month,
      year: parseInt(year),
      transactions: []
    };
    data.push(monthData);
  }
  
  monthData.transactions.push({
    ...transactionData,
    id: Date.now().toString()
  });
  
  saveData(data);
};

export const getMonthData = (monthKey: string): MonthData | undefined => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  return data.find(m => m.month === month && m.year === parseInt(year));
};

export const updateTransaction = (monthKey: string, transaction: Transaction): void => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  if (!monthData) {
    return;
  }
  
  const index = monthData.transactions.findIndex(t => t.id === transaction.id);
  if (index !== -1) {
    monthData.transactions[index] = transaction;
    saveData(data);
  }
};

export const createNewMonth = (month?: string, year?: number): { month: string; year: number } => {
  const data = loadData();
  const date = new Date();
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril',
    'Mai', 'Juin', 'Juillet', 'Août',
    'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const selectedMonth = month || monthNames[date.getMonth()];
  const selectedYear = year || date.getFullYear();
  
  // Check if month already exists
  const monthExists = data.some(m => m.month === selectedMonth && m.year === selectedYear);
  
  if (!monthExists) {
    const newMonth = {
      month: selectedMonth,
      year: selectedYear,
      transactions: []
    };
    
    data.push(newMonth);
    saveData(data);
  }
  
  return { month: selectedMonth, year: selectedYear };
};

export const deleteMonth = (month: string, year: number): void => {
  const data = loadData();
  const updatedData = data.filter(m => !(m.month === month && m.year === year));
  saveData(updatedData);
};

export const loadColocataires = (): Colocataire[] => {
  const stored = localStorage.getItem(COLOCATAIRES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

export const saveColocataires = (colocataires: Colocataire[]): void => {
  localStorage.setItem(COLOCATAIRES_KEY, JSON.stringify(colocataires));
};

export const addColocataire = (nom: string, cotisationMensuelle: number): void => {
  const colocataires = loadColocataires();
  const newColocataire: Colocataire = {
    id: Date.now().toString(),
    nom,
    cotisationMensuelle,
    dateAjout: new Date().toISOString(),
    type: 'volontaire',
    creditManuel: 0,
    responsableCourses: false
  };
  
  colocataires.push(newColocataire);
  saveColocataires(colocataires);
};

export const updateColocataire = (id: string, updates: Partial<Colocataire>): void => {
  const colocataires = loadColocataires();
  const index = colocataires.findIndex(c => c.id === id);
  
  if (index !== -1) {
    colocataires[index] = {
      ...colocataires[index],
      ...updates
    };
    saveColocataires(colocataires);
  }
};

export const deleteColocataire = (id: string): void => {
  const colocataires = loadColocataires();
  const updatedColocataires = colocataires.filter(c => c.id !== id);
  saveColocataires(updatedColocataires);
};

export const deleteTransaction = (monthKey: string, transactionId: string): void => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  if (!monthData) {
    return;
  }
  
  monthData.transactions = monthData.transactions.filter(t => t.id !== transactionId);
  saveData(data);
};

export const closeMonth = (monthKey: string): void => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  if (!monthData) {
    return;
  }

  // Sauvegarde une copie des colocataires actuels avec le mois
  monthData.closedColocataires = loadColocataires();
  monthData.isClosed = true;
  
  saveData(data);
};

export const reopenMonth = (monthKey: string, password: string): boolean => {
  if (password !== 'APA') {
    return false;
  }

  const data = loadData();
  const [month, year] = monthKey.split('-');
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  if (!monthData) {
    return false;
  }

  monthData.isClosed = false;
  monthData.closedColocataires = undefined;
  
  saveData(data);
  return true;
};

export const isMonthClosed = (monthKey: string): boolean => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  return monthData?.isClosed || false;
};

export const getMonthColocataires = (monthKey: string): Colocataire[] => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  const monthData = data.find(m => m.month === month && m.year === parseInt(year));
  
  // Si le mois est clôturé, retourner les colocataires sauvegardés
  if (monthData?.isClosed && monthData?.closedColocataires) {
    return monthData.closedColocataires;
  }
  
  // Sinon, retourner les colocataires actuels
  return loadColocataires();
};

export const loadRemboursementSettings = (): RemboursementSettings => {
  const stored = localStorage.getItem(REMBOURSEMENT_SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    regle: 'egal',
    budgetInitial: 0
  };
};

export const saveRemboursementSettings = (settings: RemboursementSettings): void => {
  localStorage.setItem(REMBOURSEMENT_SETTINGS_KEY, JSON.stringify(settings));
};

export const updateMonth = (monthKey: string, monthData: MonthData): void => {
  const months = loadData();
  const [month, year] = monthKey.split('-');
  const index = months.findIndex(m => m.month === month && m.year === parseInt(year));
  
  if (index !== -1) {
    months[index] = monthData;
    saveData(months);
  }
};
