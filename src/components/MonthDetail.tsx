
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Users, Receipt } from 'lucide-react';
import { getMonthData } from '@/utils/storage';
import { calculateMonthSummary, formatCurrency, formatDate } from '@/utils/calculations';
import AddTransactionModal from './AddTransactionModal';

const MonthDetail = () => {
  const { monthKey } = useParams<{ monthKey: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'colocataire'>('date');

  const monthData = monthKey ? getMonthData(monthKey) : undefined;
  
  const summary = useMemo(() => {
    return monthData ? calculateMonthSummary(monthData.transactions) : null;
  }, [monthData]);

  const sortedTransactions = useMemo(() => {
    if (!monthData) return [];
    
    return [...monthData.transactions].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.colocataire.localeCompare(b.colocataire);
    });
  }, [monthData, sortBy]);

  if (!monthData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Mois non trouvé</h2>
            <Button onClick={() => navigate('/')}>
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {monthData.month} {monthData.year}
          </h1>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cotisations</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalCotisations)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dépenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.totalDepenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Solde</p>
                    <p className={`text-2xl font-bold ${
                      summary.soldeGlobal >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.soldeGlobal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Colocataires</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {summary.balances.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Balances par colocataire */}
        {summary && summary.balances.length > 0 && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Résumé par colocataire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.balances.map((balance) => (
                  <div key={balance.nom} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{balance.nom}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cotisations:</span>
                        <span className="text-green-600">{formatCurrency(balance.cotisations)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dépenses:</span>
                        <span className="text-red-600">{formatCurrency(balance.depenses)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Solde:</span>
                        <span className={balance.solde >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(balance.solde)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              onClick={() => setSortBy('date')}
              size="sm"
            >
              Trier par date
            </Button>
            <Button
              variant={sortBy === 'colocataire' ? 'default' : 'outline'}
              onClick={() => setSortBy('colocataire')}
              size="sm"
            >
              Trier par personne
            </Button>
          </div>
          
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter transaction
          </Button>
        </div>

        {/* Transactions List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune transaction pour ce mois</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <Badge
                          variant={transaction.type === 'cotisation' ? 'default' : 'secondary'}
                          className={
                            transaction.type === 'cotisation'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }
                        >
                          {transaction.type === 'cotisation' ? 'Cotisation' : 'Dépense'}
                        </Badge>
                        <span className="font-medium">{transaction.colocataire}</span>
                      </div>
                      <p className="text-gray-600">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span
                        className={`text-xl font-bold ${
                          transaction.type === 'cotisation' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'cotisation' ? '+' : '-'}
                        {formatCurrency(transaction.montant)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          monthKey={monthKey!}
        />
      </div>
    </div>
  );
};

export default MonthDetail;
