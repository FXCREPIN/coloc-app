import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Calendar, Lock } from 'lucide-react';
import { loadData } from '@/utils/storage';
import { calculateMonthSummary, formatCurrency } from '@/utils/calculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ColocatairesTab from './ColocatairesTab';
import BudgetTab from './BudgetTab';
import { MonthData } from '@/types';
import NewMonthModal from './NewMonthModal';

const MONTH_ORDER: { [key: string]: number } = {
  'Janvier': 1,
  'Février': 2,
  'Mars': 3,
  'Avril': 4,
  'Mai': 5,
  'Juin': 6,
  'Juillet': 7,
  'Août': 8,
  'Septembre': 9,
  'Octobre': 10,
  'Novembre': 11,
  'Décembre': 12
};

interface MonthsTabProps {
  navigate: (path: string) => void;
  sortedMonths: MonthData[];
  onNewMonthClick: () => void;
}

const MonthsTab: React.FC<MonthsTabProps> = ({ navigate, sortedMonths, onNewMonthClick }) => {
  const handleMonthClick = (month: string, year: number) => {
    navigate(`/month/${month}-${year}`);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {sortedMonths.map((monthData) => {
          const summary = calculateMonthSummary(monthData.transactions);
          const monthKey = `${monthData.month}-${monthData.year}`;
          
          return (
            <Card 
              key={monthKey}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-lg bg-white/80 backdrop-blur-sm"
              onClick={() => handleMonthClick(monthData.month, monthData.year)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-lg font-semibold">
                      {monthData.month} {monthData.year}
                    </span>
                    {monthData.isClosed && (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${
                    summary.soldeGlobal >= 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {summary.soldeGlobal >= 0 ? 'Équilibré' : 'Déficit'}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Cotisations</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(summary.totalCotisations)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Dépenses</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(summary.totalDepenses)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Solde</span>
                      <span className={`font-bold text-lg ${
                        summary.soldeGlobal >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(summary.soldeGlobal)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {monthData.transactions.length} transaction(s)
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          onClick={onNewMonthClick}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau mois
        </Button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const monthsData = loadData();
  const [activeTab, setActiveTab] = useState("mois");
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);

  const sortedMonths = useMemo(() => {
    return [...monthsData].sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return MONTH_ORDER[b.month] - MONTH_ORDER[a.month];
    });
  }, [monthsData]);

  const handleNewMonthCreated = (month: string, year: number) => {
    navigate(`/month/${month}-${year}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Comptes Colocation
          </h1>
          <p className="text-gray-600 text-lg">
            Gérez facilement vos dépenses partagées
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-[600px] mx-auto">
            <TabsTrigger value="mois">Mois</TabsTrigger>
            <TabsTrigger value="budget">Gestion du budget</TabsTrigger>
            <TabsTrigger value="colocataires">Backlog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mois">
            <MonthsTab 
              navigate={navigate} 
              sortedMonths={sortedMonths} 
              onNewMonthClick={() => setIsNewMonthModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTab months={sortedMonths} />
          </TabsContent>
          
          <TabsContent value="colocataires">
            <ColocatairesTab />
          </TabsContent>
        </Tabs>
      </div>

      <NewMonthModal
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
        onMonthCreated={handleNewMonthCreated}
      />
    </div>
  );
};

export default Dashboard;
