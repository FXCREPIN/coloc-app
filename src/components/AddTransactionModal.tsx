import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction, getMonthColocataires, isMonthClosed } from '@/utils/storage';
import { Transaction, Colocataire } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
}

const AddTransactionModal = ({ isOpen, onClose, monthKey }: AddTransactionModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    colocataire: '',
    date: '',
    description: '',
    montant: ''
  });
  const [colocataires, setColocataires] = useState<Colocataire[]>([]);
  const isClosed = isMonthClosed(monthKey);

  useEffect(() => {
    if (monthKey) {
      const [month, year] = monthKey.split('-');
      const monthIndex = {
        'Janvier': 0, 'Février': 1, 'Mars': 2, 'Avril': 3,
        'Mai': 4, 'Juin': 5, 'Juillet': 6, 'Août': 7,
        'Septembre': 8, 'Octobre': 9, 'Novembre': 10, 'Décembre': 11
      }[month];
      
      const defaultDate = new Date(parseInt(year), monthIndex, 1);
      setFormData(prev => ({
        ...prev,
        date: defaultDate.toISOString().split('T')[0]
      }));
    }
  }, [monthKey]);

  useEffect(() => {
    setColocataires(getMonthColocataires(monthKey));
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

    if (!formData.colocataire || !formData.description || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const transaction = {
      type: 'depense' as const,
      colocataire: formData.colocataire,
      date: formData.date,
      description: formData.description,
      montant: parseFloat(formData.montant)
    };

    addTransaction(monthKey, transaction);
    
    toast({
      title: "Dépense ajoutée",
      description: `Dépense de ${formData.montant}€ ajoutée avec succès`,
    });

    setFormData({
      colocataire: '',
      date: '',
      description: '',
      montant: ''
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
              Les transactions sont verrouillées.
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
          <DialogTitle>Ajouter une dépense</DialogTitle>
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Courses Carrefour, Facture électricité..."
              required
            />
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

export default AddTransactionModal;
