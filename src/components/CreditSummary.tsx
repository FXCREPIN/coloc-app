import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthData } from '@/types';
import { calculateMonthSummary, formatCurrency } from '@/utils/calculations';
import { Coins } from 'lucide-react';
import { loadColocataires } from '@/utils/storage';

interface CreditSummaryProps {
  months: MonthData[];
}

const CreditSummary = ({ months }: CreditSummaryProps) => {
  const colocataires = loadColocataires();

  // Calculer le solde total de la colocation
  const totalBalance = months.reduce((total, month) => {
    const summary = calculateMonthSummary(month.transactions);
    return total + summary.soldeGlobal;
  }, 0);

  // Calculer les crédits par colocataire
  const credits = months.reduce<{ [key: string]: number }>((acc, month) => {
    if (!month.isClosed) return acc;

    const summary = calculateMonthSummary(month.transactions);
    summary.balances.forEach(balance => {
      if (balance.solde > 0) {
        acc[balance.nom] = (acc[balance.nom] || 0) + balance.solde;
      }
    });
    return acc;
  }, {});

  // Ajouter les crédits manuels
  colocataires.forEach(colocataire => {
    if (colocataire.creditManuel) {
      credits[colocataire.nom] = (credits[colocataire.nom] || 0) + colocataire.creditManuel;
    }
  });

  const hasCredits = Object.keys(credits).length > 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Récapitulatif des crédits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasCredits ? (
          <div className="space-y-4">
            <p className="text-gray-600">Crédits à rembourser :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(credits).map(([nom, montant]) => {
                const colocataire = colocataires.find(c => c.nom === nom);
                const creditManuel = colocataire?.creditManuel || 0;
                const creditMois = montant - creditManuel;

                return (
                  <div key={nom} className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">{nom}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(montant)}
                    </p>
                    {creditManuel > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        dont {formatCurrency(creditManuel)} de crédit manuel
                      </p>
                    )}
                    {creditMois > 0 && (
                      <p className="text-sm text-gray-600">
                        dont {formatCurrency(creditMois)} des mois clôturés
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">
              Aucun crédit en cours
            </p>
            <p className="text-2xl font-bold text-green-600">
              Économies totales : {formatCurrency(totalBalance)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditSummary; 