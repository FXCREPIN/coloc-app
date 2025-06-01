
import { MonthData, Transaction } from '@/types';

const STORAGE_KEY = 'colocation-accounts';

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

export const addTransaction = (monthKey: string, transaction: Transaction): void => {
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
    ...transaction,
    id: Date.now().toString()
  });
  
  saveData(data);
};

export const getMonthData = (monthKey: string): MonthData | undefined => {
  const data = loadData();
  const [month, year] = monthKey.split('-');
  return data.find(m => m.month === month && m.year === parseInt(year));
};
