import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BudgetChart from './BudgetChart';
import CreditSummary from './CreditSummary';
import { MonthData } from '@/types';

interface BudgetTabProps {
  months: MonthData[];
}

const BudgetTab = ({ months }: BudgetTabProps) => {
  return (
    <div className="space-y-8">
      <BudgetChart months={months} />
      <CreditSummary months={months} />
    </div>
  );
};

export default BudgetTab; 