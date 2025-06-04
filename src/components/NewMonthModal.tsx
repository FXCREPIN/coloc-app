import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNewMonth } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMonthCreated: (month: string, year: number) => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril',
  'Mai', 'Juin', 'Juillet', 'Août',
  'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const NewMonthModal = ({ isOpen, onClose, onMonthCreated }: NewMonthModalProps) => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month || !formData.year) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un mois et une année",
        variant: "destructive"
      });
      return;
    }

    const year = parseInt(formData.year);
    if (isNaN(year)) {
      toast({
        title: "Erreur",
        description: "L'année n'est pas valide",
        variant: "destructive"
      });
      return;
    }

    createNewMonth(formData.month, year);
    
    toast({
      title: "Mois créé",
      description: `Le mois de ${formData.month} ${year} a été créé avec succès`,
    });

    onMonthCreated(formData.month, year);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau mois</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="month">Mois</Label>
            <Select 
              value={formData.month} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, month: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Année</Label>
            <Input
              id="year"
              type="number"
              min={currentYear - 1}
              max={currentYear + 1}
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMonthModal; 