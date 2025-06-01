
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addTransaction } from '@/utils/storage';
import { Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
}

const AddTransactionModal = ({ isOpen, onClose, monthKey }: AddTransactionModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: 'depense' as 'cotisation' | 'depense',
    colocataire: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    montant: ''
  });

  const colocataires = ['Alice', 'Bob', 'Charlie', 'David']; // Liste fixe pour la démo

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.colocataire || !formData.description || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const transaction: Omit<Transaction, 'id'> = {
      type: formData.type,
      colocataire: formData.colocataire,
      date: formData.date,
      description: formData.description,
      montant: parseFloat(formData.montant)
    };

    addTransaction(monthKey, transaction as Transaction);
    
    toast({
      title: "Transaction ajoutée",
      description: `${formData.type === 'cotisation' ? 'Cotisation' : 'Dépense'} de ${formData.montant}€ ajoutée avec succès`,
    });

    // Reset form
    setFormData({
      type: 'depense',
      colocataire: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      montant: ''
    });

    onClose();
    
    // Refresh page to show new transaction
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'cotisation' | 'depense') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cotisation">Cotisation</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                {colocataires.map(nom => (
                  <SelectItem key={nom} value={nom}>{nom}</SelectItem>
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
