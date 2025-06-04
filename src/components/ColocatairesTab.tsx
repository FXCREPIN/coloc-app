import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, CreditCard, Save } from 'lucide-react';
import { loadColocataires, addColocataire, updateColocataire, deleteColocataire, loadData, saveRemboursementSettings, loadRemboursementSettings } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { Colocataire, RemboursementRule, RemboursementSettings } from '@/types';
import { calculateMonthSummary, formatCurrency } from '@/utils/calculations';

interface FormData {
  nom: string;
  creditManuel: string;
  email: string;
}

const ColocatairesTab = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedColocataire, setSelectedColocataire] = useState<Colocataire | null>(null);
  const [remboursementSettings, setRemboursementSettings] = useState<RemboursementSettings>(loadRemboursementSettings());
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    creditManuel: '0',
    email: ''
  });
  const [regleRemboursement, setRegleRemboursement] = useState<RemboursementRule>('egal');
  const [regleModifiee, setRegleModifiee] = useState(false);
  const [budgetInitial, setBudgetInitial] = useState(() => {
    const settings = loadRemboursementSettings();
    return settings.budgetInitial?.toString() || '0';
  });

  const colocataires = loadColocataires();
  const months = loadData();

  useEffect(() => {
    const settings = loadRemboursementSettings();
    setRegleRemboursement(settings.regle);
  }, []);

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

  const handleSubmit = (submittedData: FormData) => {
    const newColocataire: Colocataire = {
      nom: submittedData.nom,
      creditManuel: parseFloat(submittedData.creditManuel),
      email: submittedData.email
    };

    if (!submittedData.nom) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (selectedColocataire) {
      // Mode édition
      updateColocataire(selectedColocataire.id, newColocataire);
      
      toast({
        title: "Colocataire modifié",
        description: `${submittedData.nom} a été modifié avec succès`,
      });
      
      setIsEditModalOpen(false);
    } else {
      // Mode ajout
      addColocataire(submittedData.nom, 0);
      
      toast({
        title: "Colocataire ajouté",
        description: `${submittedData.nom} a été ajouté avec succès`,
      });
      
      setIsAddModalOpen(false);
    }

    setFormData({
      nom: '',
      creditManuel: '0',
      email: ''
    });

    // Recharger la liste des colocataires sans rafraîchir la page
    const updatedColocataires = loadColocataires();
    // Force un re-render en modifiant l'état local
    setRegleModifiee(!regleModifiee);
  };

  const handleEdit = (colocataire: Colocataire) => {
    setSelectedColocataire(colocataire);
    setFormData({
      nom: colocataire.nom,
      creditManuel: colocataire.creditManuel?.toString() || '0',
      email: colocataire.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteColocataire(id);
    toast({
      title: "Colocataire supprimé",
      description: "Le colocataire a été supprimé avec succès",
    });
    // Force un re-render en modifiant l'état local
    setRegleModifiee(!regleModifiee);
  };

  const handleSaveRegle = () => {
    saveRemboursementSettings({ 
      regle: regleRemboursement,
      budgetInitial: parseFloat(budgetInitial) || 0
    });
    toast({
      title: "Règle enregistrée",
      description: "La règle de remboursement a été mise à jour",
    });
    setRegleModifiee(false);
  };

  const ColocataireForm = () => {
    const [localFormData, setLocalFormData] = useState<FormData>(formData);

    useEffect(() => {
      setLocalFormData(formData);
    }, [formData]);

    const handleLocalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(localFormData);
    };

    return (
      <form onSubmit={handleLocalSubmit} className="space-y-6">
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={localFormData.nom}
            onChange={(e) => setLocalFormData(prev => ({ ...prev, nom: e.target.value }))}
            placeholder="Nom du colocataire"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={localFormData.email}
            onChange={(e) => setLocalFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Entrez l'adresse email"
          />
        </div>

        <div>
          <Label htmlFor="creditManuel">Crédit manuel (€)</Label>
          <Input
            id="creditManuel"
            type="number"
            step="0.01"
            value={localFormData.creditManuel}
            onChange={(e) => setLocalFormData(prev => ({ ...prev, creditManuel: e.target.value }))}
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (selectedColocataire) {
                setIsEditModalOpen(false);
              } else {
                setIsAddModalOpen(false);
              }
              setFormData({
                nom: '',
                creditManuel: '0',
                email: ''
              });
            }}
          >
            Annuler
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
            {selectedColocataire ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-8">
      {/* Règle de remboursement */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Règle de remboursement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={regleRemboursement}
            onValueChange={(value: RemboursementRule) => {
              setRegleRemboursement(value);
              setRegleModifiee(true);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une règle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="egal">Égal pour tous</SelectItem>
              <SelectItem value="egal-accueillis">Égal pour tous en commençant par les accueillis</SelectItem>
              <SelectItem value="priorisation">Priorisation des colocataires</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Label htmlFor="budgetInitial">Budget de départ de la colocation</Label>
            <Input
              id="budgetInitial"
              type="number"
              step="0.01"
              min="0"
              value={budgetInitial}
              onChange={(e) => {
                setBudgetInitial(e.target.value);
                setRegleModifiee(true);
              }}
              placeholder="0.00"
            />
          </div>

          <Button
            onClick={handleSaveRegle}
            disabled={!regleModifiee}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer la règle
          </Button>
        </CardContent>
      </Card>

      {/* Liste des colocataires */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des colocataires</CardTitle>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un colocataire
          </Button>
        </CardHeader>
        <CardContent>
          {colocataires.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun colocataire enregistré
            </div>
          ) : (
            <div className="space-y-4">
              {colocataires.map((colocataire) => (
                <div
                  key={colocataire.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{colocataire.nom}</h3>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Crédit : {formatCurrency((colocataire.creditManuel || 0) + (credits[colocataire.nom] || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(colocataire)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera définitivement le colocataire.
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(colocataire.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un colocataire</DialogTitle>
          </DialogHeader>
          <ColocataireForm />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier un colocataire</DialogTitle>
          </DialogHeader>
          <ColocataireForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColocatairesTab; 