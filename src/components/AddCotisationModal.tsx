import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTransaction, getMonthColocataires, isMonthClosed } from '@/utils/storage';
import { Transaction, Colocataire } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AddCotisationModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
}

const AddCotisationModal = ({ isOpen, onClose, monthKey }: AddCotisationModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    colocataire: '',
    montant: '',
    deduitDesCourses: false
  });
  const [defaultDate, setDefaultDate] = useState('');
  const [colocataires, setColocataires] = useState<Colocataire[]>([]);
  const isClosed = isMonthClosed(monthKey);

  useEffect(() => {
    setColocataires(getMonthColocataires(monthKey));
  }, [monthKey]);

  useEffect(() => {
    if (monthKey) {
      const [month, year] = monthKey.split('-');
      const monthIndex = {
        'Janvier': 0, 'Février': 1, 'Mars': 2, 'Avril': 3,
        'Mai': 4, 'Juin': 5, 'Juillet': 6, 'Août': 7,
        'Septembre': 8, 'Octobre': 9, 'Novembre': 10, 'Décembre': 11
      }[month];
      
      const date = new Date(parseInt(year), monthIndex, 1);
      setDefaultDate(date.toISOString().split('T')[0]);
    }
  }, [monthKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isClosed) {
      toast({
        title: "Action impossible",
        description: "Ce mois est clôturé et ne peut plus être modifié.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.colocataire || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const transaction = {
      type: 'cotisation' as const,
      colocataire: formData.colocataire,
      date: defaultDate,
      description: formData.deduitDesCourses ? 'Cotisation mensuelle (déduite des courses)' : 'Cotisation mensuelle',
      montant: parseFloat(formData.montant)
    };

    addTransaction(monthKey, transaction);
    
    toast({
      title: "Cotisation ajoutée",
      description: `Cotisation de ${formData.montant}€ ajoutée pour ${formData.colocataire}`,
    });

    setFormData({
      colocataire: '',
      montant: '',
      deduitDesCourses: false
    });

    onClose();
    window.location.reload();
  };

  if (isClosed) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Mois clôturé
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-500">
              Ce mois est clôturé et ne peut plus être modifié.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une cotisation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="colocataire">Colocataire</Label>
            <Select 
              value={formData.colocataire} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, colocataire: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un colocataire" />
              </SelectTrigger>
              <SelectContent>
                {colocataires.map(colocataire => (
                  <SelectItem key={colocataire.id} value={colocataire.nom}>
                    {colocataire.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="montant">Montant (€)</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              min="0"
              value={formData.montant}
              onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="deduitDesCourses"
              checked={formData.deduitDesCourses}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, deduitDesCourses: checked as boolean }))
              }
            />
            <Label htmlFor="deduitDesCourses">
              Somme déduite des courses effectuées
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCotisationModal; 