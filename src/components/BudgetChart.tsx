import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthData } from '@/types';
import { calculateMonthSummary, formatCurrency } from '@/utils/calculations';

interface BudgetChartProps {
  months: MonthData[];
}

const BudgetChart = ({ months }: BudgetChartProps) => {
  const data = months
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder: { [key: string]: number } = {
        'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
        'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
        'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
      };
      return monthOrder[a.month] - monthOrder[b.month];
    })
    .map(month => {
      const summary = calculateMonthSummary(month.transactions);
      return {
        name: `${month.month} ${month.year}`,
        solde: summary.soldeGlobal,
        cotisations: summary.totalCotisations,
        depenses: summary.totalDepenses
      };
    });

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Évolution du budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line 
                type="monotone" 
                dataKey="solde" 
                stroke="#8884d8" 
                name="Solde"
              />
              <Line 
                type="monotone" 
                dataKey="cotisations" 
                stroke="#82ca9d" 
                name="Cotisations"
              />
              <Line 
                type="monotone" 
                dataKey="depenses" 
                stroke="#ff7c7c" 
                name="Dépenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetChart; 