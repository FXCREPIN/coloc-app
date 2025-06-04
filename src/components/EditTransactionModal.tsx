import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateTransaction, deleteTransaction, getMonthColocataires, isMonthClosed } from '@/utils/storage';
import { Transaction, Colocataire } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Lock } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
  transaction: Transaction;
}

const EditTransactionModal = ({ isOpen, onClose, monthKey, transaction }: EditTransactionModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: transaction.type,
    colocataire: transaction.colocataire,
    date: transaction.date,
    description: transaction.description,
    montant: transaction.montant.toString()
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [colocataires, setColocataires] = useState<Colocataire[]>([]);
  const isClosed = isMonthClosed(monthKey);

  useEffect(() => {
    setColocataires(getMonthColocataires(monthKey));
  }, [monthKey]);

  useEffect(() => {
    setFormData({
      type: transaction.type,
      colocataire: transaction.colocataire,
      date: transaction.date,
      description: transaction.description,
      montant: transaction.montant.toString()
    });
  }, [transaction]);

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

    const updatedTransaction: Transaction = {
      ...transaction,
      type: formData.type,
      colocataire: formData.colocataire,
      date: formData.date,
      description: formData.description,
      montant: parseFloat(formData.montant)
    };

    updateTransaction(monthKey, updatedTransaction);
    
    toast({
      title: "Transaction modifiée",
      description: `${formData.type === 'cotisation' ? 'Cotisation' : 'Dépense'} de ${formData.montant}€ modifiée avec succès`,
    });

    onClose();
    window.location.reload();
  };

  const handleDelete = () => {
    if (isClosed) {
      toast({
        title: "Action impossible",
        description: "Ce mois est clôturé et ne peut plus être modifié.",
        variant: "destructive"
      });
      return;
    }

    deleteTransaction(monthKey, transaction.id);
    
    toast({
      title: "Transaction supprimée",
      description: `${transaction.type === 'cotisation' ? 'Cotisation' : 'Dépense'} de ${transaction.montant}€ supprimée avec succès`,
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
          <DialogTitle>Modifier la transaction</DialogTitle>
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement la transaction.
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal; 