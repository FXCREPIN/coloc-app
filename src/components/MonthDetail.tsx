import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Users, Receipt, CreditCard, Eye, EyeOff, Trash2, AlertCircle, Check, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { getMonthData, loadData, saveData, deleteMonth, loadColocataires, loadRemboursementSettings, getMonthColocataires, updateMonth } from '@/utils/storage';
import { calculateMonthSummary, formatCurrency, formatDate } from '@/utils/calculations';
import AddTransactionModal from './AddTransactionModal';
import AddCotisationModal from './AddCotisationModal';
import EditTransactionModal from './EditTransactionModal';
import { Transaction, Colocataire, RemboursementRule } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import html2pdf from 'html2pdf.js';
import emailjs from '@emailjs/browser';
import { generatePDF } from '@/utils/pdf';

interface RemboursementDetail {
  id: string;
  colocataire: string;
  montant: number;
  raison: string;
}

// Configuration EmailJS
const EMAILJS_CONFIG = {
  PUBLIC_KEY: "XavZehxGMCIOU46Qp",
  SERVICE_ID: "service_v2d2nd4",
  TEMPLATE_ID: "template_urs680o"
};

// Composant pour les sections dépliables
const CollapsibleSection = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="mb-8">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 rounded-lg bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90 transition-all"
    >
      <div className="text-gray-600">
        {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
      </div>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-lg font-medium">{title}</span>
      </div>
    </button>
    {isOpen && (
      <div className="mt-4 rounded-lg overflow-hidden transition-all">
        {children}
      </div>
    )}
  </div>
);

const MonthDetail = () => {
  const { monthKey } = useParams<{ monthKey: string }>();
  const navigate = useNavigate();
  const monthData = monthKey ? getMonthData(monthKey) : undefined;
  const colocataires = loadColocataires();

  // Initialisation d'EmailJS avec la clé publique
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCotisationModalOpen, setIsAddCotisationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'colocataire'>('date');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showRemarques, setShowRemarques] = useState(false);
  const [showCloseMonth, setShowCloseMonth] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('depenses');
  const [remarques, setRemarques] = useState(monthData?.remarques || '');

  // Nouveaux états pour les toggles
  const [useEconomies, setUseEconomies] = useState(false);
  const [montantEconomies, setMontantEconomies] = useState(0);
  const [remboursements, setRemboursements] = useState<RemboursementDetail[]>([]);
  const [soldeGlobal, setSoldeGlobal] = useState(0);
  const [balancesFinales, setBalancesFinales] = useState<Array<{
    nom: string;
    montantFinal: number;
    depensesMois: number;
    remboursementOuCredit: number;
  }>>([]);
  const [isFinalConfirmationOpen, setIsFinalConfirmationOpen] = useState(false);
  const [isAjustementEcartOpen, setIsAjustementEcartOpen] = useState(false);
  const [ecartInitial, setEcartInitial] = useState(0);
  const [remboursementsManuels, setRemboursementsManuels] = useState<Array<{
    id: string;
    colocataire: string;
    montant: number;
  }>>([]);

  // Nouveaux états pour la clôture du mois
  const [cotisationsDeduites, setCotisationsDeduites] = useState<number>(0);
  const [remboursementsParColocataire, setRemboursementsParColocataire] = useState<{
    [key: string]: Array<{
      id: string;
      montant: number;
      destinataire: string;
    }>;
  }>({});

  const [montantPrelevement, setMontantPrelevement] = useState(0);
  const [creditsColocatairesAjout, setCreditsColocatairesAjout] = useState<Array<{
    id: string;
    colocataire: string;
    montant: number;
  }>>([]);

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Calculer le montant total des économies disponibles
  const economiesDisponibles = useMemo(() => {
    // TODO: Implémenter le calcul des économies disponibles
    // Pour l'instant, on retourne une valeur par défaut de 0
    return 0;
  }, []);

  const summary = useMemo(() => {
    return monthData ? calculateMonthSummary(monthData.transactions) : null;
  }, [monthData]);

  const montantTotal = useMemo(() => {
    // On garde la valeur positive ici
    return Math.round(Math.abs(summary?.soldeGlobal || 0) * 100) / 100;
  }, [summary]);

  const isNegativeBalance = (summary?.soldeGlobal || 0) < 0;

  const totalRembourse = useMemo(() => {
    const total = remboursements.reduce((sum, r) => {
      const montant = typeof r.montant === 'string' ? parseFloat(r.montant) : r.montant;
      return sum + Math.abs(montant || 0);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [remboursements]);

  // Comparer les valeurs positives
  const isValidTotal = Math.abs(montantTotal - totalRembourse) < 0.001;

  // Calculer le crédit total pour chaque colocataire
  const creditsColocataires = useMemo(() => {
    const credits: { [key: string]: number } = {};
    
    // Initialiser avec les crédits manuels
    colocataires.forEach(c => {
      credits[c.nom] = c.creditManuel || 0;
    });

    // Ajouter les remboursements des mois clôturés
    const data = loadData();
    data.forEach(month => {
      if (!month.isClosed || `${month.month}-${month.year}` === monthKey) return;
      
      const monthSummary = calculateMonthSummary(month.transactions);
      monthSummary.balances.forEach(balance => {
        if (balance.solde > 0) {
          credits[balance.nom] = (credits[balance.nom] || 0) + balance.solde;
        }
      });
    });

    return credits;
  }, [colocataires, monthKey]);

  const sortedTransactions = useMemo(() => {
    if (!monthData) return [];
    
    return [...monthData.transactions].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.colocataire.localeCompare(b.colocataire);
    });
  }, [monthData, sortBy]);

  // Filtrer les transactions par type
  const depenses = useMemo(() => {
    return sortedTransactions.filter(t => t.type === 'depense');
  }, [sortedTransactions]);

  const cotisations = useMemo(() => {
    return sortedTransactions.filter(t => t.type === 'cotisation');
  }, [sortedTransactions]);

  // Calcul des cotisations déduites des courses
  const cotisationsPrelevees = useMemo(() => {
    if (!monthData) return 0;
    return monthData.transactions
      .filter(t => t.type === 'cotisation' && t.description.includes('déduite des courses'))
      .reduce((sum, t) => sum + t.montant, 0);
  }, [monthData]);

  // Calcul du montant total restant à rembourser
  const montantRestantARembourser = useMemo(() => {
    if (!summary) return 0;
    return summary.totalDepenses - cotisationsPrelevees;
  }, [summary, cotisationsPrelevees]);

  // Calcul des montants à rembourser par colocataire
  const montantsARembourser = useMemo(() => {
    if (!summary || !monthData) return {};

    return summary.balances.reduce((acc, balance) => {
      // Trouver les cotisations déduites pour ce colocataire
      const cotisationsDeduitesColocataire = monthData.transactions
        .filter(t => 
          t.type === 'cotisation' && 
          t.colocataire === balance.nom && 
          t.description.includes('déduite des courses')
        )
        .reduce((sum, t) => sum + t.montant, 0);

      // Montant à rembourser = dépenses - cotisations déduites
      const montant = balance.depenses - cotisationsDeduitesColocataire;

      return {
        ...acc,
        [balance.nom]: montant
      };
    }, {});
  }, [summary, monthData]);

  // État pour stocker les montants modifiés manuellement
  const [montantsModifies, setMontantsModifies] = useState<{[key: string]: number}>(() => {
    // Initialiser avec les montants calculés
    const initial: {[key: string]: number} = {};
    if (summary) {
      summary.balances.forEach(balance => {
        const montantInitial = montantsARembourser[balance.nom] || 0;
        initial[balance.nom] = montantInitial;
      });
    }
    return initial;
  });

  // Fonction pour mettre à jour un montant
  const handleUpdateMontant = (colocataire: string, montant: number) => {
    setMontantsModifies(prev => ({
      ...prev,
      [colocataire]: isNaN(montant) ? 0 : montant
    }));
  };

  // Calcul du total des remboursements saisis manuellement
  const totalRemboursementsSaisis = useMemo(() => {
    return Object.values(montantsModifies).reduce((sum, montant) => sum + (montant || 0), 0);
  }, [montantsModifies]);

  // Vérification de la validité des remboursements
  const validationRemboursements = useMemo(() => {
    if (!summary) return { isValid: false, difference: 0 };

    const difference = montantRestantARembourser - totalRemboursementsSaisis;
    return {
      isValid: Math.abs(difference) < 0.01,
      difference
    };
  }, [totalRemboursementsSaisis, montantRestantARembourser, summary]);

  // Formater un nombre avec exactement 2 décimales
  const formatNumberWithTwoDecimals = (value: number): string => {
    return value.toFixed(2);
  };

  // Valider et formater l'entrée numérique
  const validateAndFormatNumber = (value: string): number => {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) return 0;
    return Math.round(parsedValue * 100) / 100;
  };

  // Calculer le solde du mois (cotisations - dépenses)
  const soldeMois = useMemo(() => {
    if (!summary) return 0;
    return summary.totalCotisations - summary.totalDepenses;
  }, [summary]);

  // Vérifier la validité des montants saisis
  const validationMontants = useMemo(() => {
    if (!summary) return { isValid: false, difference: 0 };

    const totalSaisi = totalRemboursementsSaisis + (useEconomies ? montantEconomies : 0);
    const montantCible = Math.abs(soldeMois);
    const difference = Math.abs(totalSaisi - montantCible);

    return {
      isValid: difference < 0.01,
      difference,
      message: soldeMois >= 0
        ? "Le total des remboursements et économies doit égaler le solde positif"
        : "Le total des crédits attribués doit égaler le déficit"
    };
  }, [summary, totalRemboursementsSaisis, useEconomies, montantEconomies, soldeMois]);

  // Calculer l'écart restant à allouer
  const ecartRestant = useMemo(() => {
    if (!summary) return 0;
    if (summary.soldeGlobal >= 0) {
      // Cas solde positif
      const totalRemboursementsManuels = remboursementsManuels.reduce((sum, r) => sum + r.montant, 0);
      return summary.soldeGlobal - (montantEconomies + totalRemboursementsManuels);
    } else {
      // Cas solde négatif
      const totalCredits = creditsColocatairesAjout.reduce((sum, r) => sum + r.montant, 0);
      return Math.abs(summary.soldeGlobal) - (montantPrelevement + totalCredits);
    }
  }, [summary, montantEconomies, remboursementsManuels, montantPrelevement, creditsColocatairesAjout]);

  // Vérifier si l'allocation de l'écart est valide
  const isAllocationValide = useMemo(() => {
    return Math.abs(ecartRestant) < 0.01;
  }, [ecartRestant]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirmationChange = (value: string) => {
    setDeleteConfirmation(value);
  };

  const handleDeleteMonth = () => {
    if (deleteConfirmation !== 'SUPPRIMER CE MOIS') {
      return;
    }

    if (monthData) {
      deleteMonth(monthData.month, monthData.year);
      navigate('/');
    }
  };

  const handleStatusChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fonction pour sauvegarder les remarques
  const handleRemarquesChange = (value: string) => {
    if (!monthData) return;
    
    const updatedData = loadData().map(m => {
      if (m.month === monthData.month && m.year === monthData.year) {
        return { ...m, remarques: value };
      }
      return m;
    });
    
    saveData(updatedData);
    setRemarques(value);
  };

  // Fonction pour gérer la visibilité des transactions
  const handleTransactionsVisibility = () => {
    if (!monthData) return;
    
    const newVisibility = !showTransactions;
    const updatedData = loadData().map(m => {
      if (m.month === monthData.month && m.year === monthData.year) {
        return { ...m, isTransactionsVisible: newVisibility };
      }
      return m;
    });
    
    saveData(updatedData);
    setShowTransactions(newVisibility);
  };

  const handleFinalConfirmation = () => {
    if (!monthData || !summary) return;

    // Convertir les remboursements en format final
    const remboursementsFinal = Object.entries(remboursementsParColocataire).flatMap(([colocataire, remboursements]) =>
      remboursements.map(r => ({
        id: r.id,
        colocataire,
        montant: r.montant,
        destinataire: r.destinataire,
        raison: `Remboursement de ${colocataire} à ${r.destinataire}`
      }))
    );

    // Mettre à jour les données du mois
    const updatedMonthData = {
      ...monthData,
      isClosed: true,
      closedColocataires: getMonthColocataires(monthKey),
      remboursements: remboursementsFinal
    };

    updateMonth(monthKey, updatedMonthData);
    
    toast({
      title: "Mois clôturé",
      description: "Le mois a été clôturé avec succès",
    });

    setIsFinalConfirmationOpen(false);
    setShowCloseMonth(false);
    navigate('/');
  };

  // Fonction pour ajouter un remboursement
  const handleAddRemboursement = (colocataire: string) => {
    setRemboursementsParColocataire(prev => ({
      ...prev,
      [colocataire]: [
        ...(prev[colocataire] || []),
        {
          id: Date.now().toString(),
          montant: 0,
          destinataire: ''
        }
      ]
    }));
  };

  // Fonction pour mettre à jour un remboursement
  const handleUpdateRemboursement = (
    colocataire: string,
    remboursementId: string,
    updates: Partial<{ montant: number; destinataire: string }>
  ) => {
    setRemboursementsParColocataire(prev => ({
      ...prev,
      [colocataire]: prev[colocataire].map(r =>
        r.id === remboursementId ? { ...r, ...updates } : r
      )
    }));
  };

  // Fonction pour supprimer un remboursement
  const handleDeleteRemboursement = (colocataire: string, remboursementId: string) => {
    setRemboursementsParColocataire(prev => ({
      ...prev,
      [colocataire]: prev[colocataire].filter(r => r.id !== remboursementId)
    }));
  };

  // Gérer l'ajout d'un nouveau remboursement manuel
  const handleAjoutRemboursementManuel = () => {
    setRemboursementsManuels(prev => [...prev, {
      id: Date.now().toString(),
      colocataire: '',
      montant: 0
    }]);
  };

  // Mettre à jour un remboursement manuel
  const handleUpdateRemboursementManuel = (id: string, updates: Partial<{
    colocataire: string;
    montant: number;
  }>) => {
    setRemboursementsManuels(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  // Supprimer un remboursement manuel
  const handleDeleteRemboursementManuel = (id: string) => {
    setRemboursementsManuels(prev => prev.filter(r => r.id !== id));
  };

  // Gérer l'ajout d'une ligne de crédit
  const handleAjoutCredit = () => {
    setCreditsColocatairesAjout(prev => [...prev, {
      id: Date.now().toString(),
      colocataire: '',
      montant: 0
    }]);
  };

  // Mettre à jour une ligne de crédit
  const handleUpdateCredit = (id: string, updates: Partial<{
    colocataire: string;
    montant: number;
  }>) => {
    setCreditsColocatairesAjout(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  // Supprimer une ligne de crédit
  const handleDeleteCredit = (id: string) => {
    setCreditsColocatairesAjout(prev => prev.filter(r => r.id !== id));
  };

  // Gérer le clic sur le bouton de clôture
  const handleCloseMonth = () => {
    if (summary) {
      // Réinitialiser les valeurs
      setMontantEconomies(0);
      setMontantPrelevement(0);
      setRemboursementsManuels([]);
      setCreditsColocatairesAjout([]);
      setIsAjustementEcartOpen(true);
    }
  };

  // Gérer la validation de l'ajustement de l'écart
  const handleValidateAjustement = () => {
    setIsAjustementEcartOpen(false);
    setIsFinalConfirmationOpen(true);
  };

  // Calculer les remboursements finaux par colocataire
  const remboursementsFinaux = useMemo(() => {
    if (!summary) return new Map<string, number>();
    
    const remboursements = new Map<string, number>();
    
    // 1. Ajouter les montants de base des remboursements
    Object.entries(montantsModifies).forEach(([colocataire, montant]) => {
      remboursements.set(colocataire, montant);
    });
    
    // 2. Ajouter les remboursements manuels (cas solde positif)
    remboursementsManuels.forEach((remb) => {
      const montantActuel = remboursements.get(remb.colocataire) || 0;
      remboursements.set(remb.colocataire, montantActuel + remb.montant);
    });
    
    // 3. Soustraire les crédits (cas solde négatif)
    creditsColocatairesAjout.forEach((credit) => {
      const montantActuel = remboursements.get(credit.colocataire) || 0;
      remboursements.set(credit.colocataire, montantActuel - credit.montant);
    });
    
    return remboursements;
  }, [summary, montantsModifies, remboursementsManuels, creditsColocatairesAjout]);

  // Fonction pour générer le message récapitulatif
  const generateRecapMessage = () => {
    if (!summary || !monthData) return '';

    const economiesTotal = montantEconomies || 0; // À adapter selon votre logique d'économies

    // Construction du message
    const parts = [
      `🧾 Dépenses du mois : ${formatCurrency(summary.totalDepenses)}`,
      `💸 Cotisations du mois : ${formatCurrency(summary.totalCotisations)}`,
      `⚖️ Solde du mois : ${formatCurrency(summary.soldeGlobal)}`,
      `🏦 Économies de la colocation : ${formatCurrency(economiesTotal)}`,
      '',
      '📊 Solde individuel :',
      ...summary.balances.map(balance => `- ${balance.nom} : ${formatCurrency(balance.solde)}`),
      ''
    ];

    // Ajouter les remboursements s'il y en a
    const remboursements = Array.from(remboursementsFinaux.entries())
      .filter(([_, montant]) => montant > 0)
      .map(([colocataire, montant]) => `- ${colocataire} reçoit ${formatCurrency(montant)}`);

    if (remboursements.length > 0) {
      parts.push('🔁 Remboursements effectués :');
      parts.push(...remboursements);
      parts.push('');
    }

    // Ajouter les crédits s'il y en a
    const credits = creditsColocatairesAjout
      .filter(credit => credit.montant > 0)
      .map(credit => `- ${credit.colocataire} : ${formatCurrency(credit.montant)}`);

    if (credits.length > 0) {
      parts.push('💳 Crédits reportés :');
      parts.push(...credits);
      parts.push('');
    } else {
      parts.push('📌 Aucun crédit reporté ce mois.');
      parts.push('');
    }

    // Ajouter le lien vers la plateforme
    parts.push('📲 Pour en savoir plus, allez directement sur la plateforme :');
    parts.push('https://tonapp.fr');

    return parts.join('\n');
  };

  // Fonction pour envoyer le récapitulatif par email
  const handleSendRecap = async () => {
    try {
      // Réinitialiser EmailJS par sécurité
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

      // Générer le message récapitulatif
      const messageContent = generateRecapMessage();

      // Récupérer les colocataires et leurs emails
      const colocataires = loadColocataires();
      type ColocataireWithEmail = Colocataire & { email: string };
      
      const colocatairesAvecEmail = colocataires.filter((c): c is ColocataireWithEmail => {
        const emailProp = (c as ColocataireWithEmail).email;
        return typeof emailProp === 'string' && emailProp.length > 0;
      });
      
      if (colocatairesAvecEmail.length === 0) {
        toast({
          title: "Aucun destinataire",
          description: "Aucun colocataire n'a d'adresse email enregistrée.",
          variant: "destructive",
        });
        return;
      }
      
      // Envoyer le mail à chaque colocataire ayant un email
      for (const colocataire of colocatairesAvecEmail) {
        try {
          const templateParams = {
            to_email: colocataire.email,
            to_name: colocataire.nom,
            month: monthData?.month,
            year: monthData?.year,
            message: messageContent
          };

          await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            EMAILJS_CONFIG.PUBLIC_KEY
          );
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi du mail:', emailError);
          throw new Error(`Erreur lors de l'envoi du mail à ${colocataire.nom}: ${emailError.message}`);
        }
      }

      toast({
        title: "✅ Mail envoyé avec succès !",
        description: (
          <div className="mt-2">
            <p className="mb-2">Le récapitulatif du mois a été envoyé à :</p>
            <ul className="list-disc pl-4">
              {colocatairesAvecEmail.map(c => (
                <li key={c.id}>{c.nom}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5000,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du récapitulatif:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi du récapitulatif.",
        variant: "destructive",
      });
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {monthData.month} {monthData.year}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsAddCotisationModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Ajouter une cotisation
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépense
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ce mois
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce mois</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Pour confirmer, tapez exactement : SUPPRIMER CE MOIS
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="SUPPRIMER CE MOIS"
                    value={deleteConfirmation}
                    onChange={(e) => handleDeleteConfirmationChange(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteMonth}
                    disabled={deleteConfirmation !== 'SUPPRIMER CE MOIS'}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Cartes de résumé - Toujours visibles */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cotisations</p>
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
                    <p className="text-sm text-muted-foreground">Dépenses</p>
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
                    <p className="text-sm text-muted-foreground">Solde</p>
                    <p className={`text-2xl font-bold ${
                      summary.soldeGlobal >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
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
                    <p className="text-sm text-muted-foreground">Colocataires</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {summary.balances.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Résumé par colocataire */}
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
                {summary.balances.map((balance) => {
                  const cotisationsDeduitesColocataire = monthData?.transactions
                    .filter(t => 
                      t.type === 'cotisation' && 
                      t.colocataire === balance.nom && 
                      t.description.includes('déduite des courses')
                    )
                    .reduce((sum, t) => sum + t.montant, 0) || 0;

                  return (
                    <div key={balance.nom} className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">{balance.nom}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total des dépenses:</span>
                          <span className="text-red-600">{formatCurrency(balance.depenses)}</span>
                        </div>
                        {cotisationsDeduitesColocataire > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cotisation déduite:</span>
                            <span className="text-green-600">-{formatCurrency(cotisationsDeduitesColocataire)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sections dépliables */}
        <CollapsibleSection
          title="🧾 Voir les transactions et les cotisations"
          icon={<Receipt className="h-5 w-5" />}
          isOpen={showTransactions}
          onToggle={() => setShowTransactions(!showTransactions)}
        >
          {/* Contenu existant des transactions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <TabsList>
                    <TabsTrigger value="depenses" className="min-w-[120px]">
                      Voir les dépenses
                    </TabsTrigger>
                    <TabsTrigger value="cotisations" className="min-w-[120px]">
                      Voir les cotisations
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2 ml-4">
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTransactionsVisibility}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showTransactions ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Afficher
                    </>
                  )}
                </Button>
              </div>

              {showTransactions && (
                <>
                  <TabsContent value="depenses">
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      {depenses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune dépense pour ce mois</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {depenses.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => handleTransactionClick(transaction)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-700 hover:bg-red-200"
                                  >
                                    Dépense
                                  </Badge>
                                  <span className="font-medium">{transaction.colocataire}</span>
                                </div>
                                <p className="text-gray-600">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                              <div className="mt-2 sm:mt-0">
                                <span className="text-xl font-bold text-red-600">
                                  -{formatCurrency(transaction.montant)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  <TabsContent value="cotisations">
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      {cotisations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune cotisation pour ce mois</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cotisations.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => handleTransactionClick(transaction)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                  <Badge
                                    variant="default"
                                    className="bg-green-100 text-green-700 hover:bg-green-200"
                                  >
                                    Cotisation
                                  </Badge>
                                  <span className="font-medium">{transaction.colocataire}</span>
                                </div>
                                <p className="text-gray-600">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                              <div className="mt-2 sm:mt-0">
                                <span className="text-xl font-bold text-green-600">
                                  +{formatCurrency(transaction.montant)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="📝 Ajouter une remarque"
          icon={<AlertCircle className="h-5 w-5" />}
          isOpen={showRemarques}
          onToggle={() => setShowRemarques(!showRemarques)}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Ajouter des remarques pour ce mois..."
                value={remarques}
                onChange={(e) => handleRemarquesChange(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </CollapsibleSection>

        <CollapsibleSection
          title="✅ Clôturer le mois"
          icon={<Check className="h-5 w-5" />}
          isOpen={showCloseMonth}
          onToggle={() => setShowCloseMonth(!showCloseMonth)}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Clôture du mois</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 1. Montant total à rembourser */}
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    💰 1. Montant total à rembourser ce mois-ci
                  </h3>
                  <p className="text-blue-700 text-xl mb-1">
                    {formatCurrency(summary?.totalDepenses || 0)}
                  </p>
                  <p className="text-sm text-blue-600">
                    (correspond à la somme brute des dépenses avant cotisation)
                  </p>
                </div>

                {/* 2. Montant des cotisations prélevées */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    💳 Montant des cotisations prélevées sur les dépenses
                  </h3>
                  <p className="text-green-700 text-xl mb-1">
                    {formatCurrency(cotisationsPrelevees)}
                  </p>
                  <p className="text-sm text-green-600">
                    Montant des cotisations prélevées directement lors des courses
                  </p>
                </div>

                {/* 3. Montant total restant à rembourser */}
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    ✅ 3. Montant total restant à rembourser
                  </h3>
                  <p className="text-purple-700 text-xl mb-1">
                    {formatCurrency(montantRestantARembourser)}
                  </p>
                  <p className="text-sm text-purple-600">
                    Total dépenses – Cotisations déduites
                  </p>
                </div>

                {/* 4. Répartition personnalisée des remboursements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    👤 Répartition des remboursements par colocataire
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary?.balances.map((balance) => {
                      const montantInitial = montantsARembourser[balance.nom] || 0;
                      const creditDisponible = creditsColocataires[balance.nom] || 0;

                      return (
                        <div key={balance.nom} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-700">
                                {balance.nom}
                              </h4>
                            </div>

                            {/* 1. Montant calculé (non modifiable) */}
                            <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-md">
                              <span className="text-sm text-gray-600">
                                👉 Montant à rembourser :
                              </span>
                              <span className="font-medium text-gray-700">
                                {formatCurrency(montantInitial)}
                              </span>
                            </div>

                            {/* 2. Montant choisi (modifiable) */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  💬 Choisir de rembourser :
                                </span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formatNumberWithTwoDecimals(montantsModifies[balance.nom] || 0)}
                                    onChange={(e) => handleUpdateMontant(balance.nom, validateAndFormatNumber(e.target.value))}
                                    className="w-[150px]"
                                  />
                                  <span className="text-sm text-gray-500">€</span>
                                </div>
                              </div>

                              {/* 3. Crédit disponible */}
                              <div className="flex items-center gap-2 text-sm text-gray-500 pl-3">
                                <span>💰 Crédit des mois précédents :</span>
                                <span className="font-medium">{formatCurrency(creditDisponible)} €</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Interface dynamique - Total et validation */}
                <div className="border-t pt-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        💰 Total des remboursements saisis :
                      </span>
                      <span className={`font-bold ${
                        validationRemboursements.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(totalRemboursementsSaisis)}
                      </span>
                    </div>

                    {!validationRemboursements.isValid ? (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          Le total des remboursements ne correspond pas au montant total des dépenses.
                          <br />
                          <span className="font-medium">
                            Différence : {formatCurrency(Math.abs(validationRemboursements.difference))} €
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Les montants sont équilibrés, vous pouvez clôturer le mois.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleCloseMonth}
                      disabled={!validationRemboursements.isValid}
                      className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      Clôturer le mois
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleSection>

        {/* Pop-up d'ajustement de l'écart */}
        <Dialog open={isAjustementEcartOpen} onOpenChange={setIsAjustementEcartOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajuster l'écart</DialogTitle>
              <DialogDescription>
                {summary?.soldeGlobal >= 0 ? (
                  `🎯 Il reste ${formatCurrency(Math.abs(ecartRestant))} € de solde positif à répartir. Où souhaitez-vous l'allouer ?`
                ) : (
                  `🎯 Il reste ${formatCurrency(Math.abs(summary?.soldeGlobal || 0))} € de solde négatif à compenser. Comment souhaitez-vous le répartir ?`
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-6">
              {summary?.soldeGlobal >= 0 ? (
                <>
                  {/* Section Économies - Solde positif */}
                  <div className="space-y-2">
                    <Label>💰 Économies de la coloc</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formatNumberWithTwoDecimals(montantEconomies)}
                        onChange={(e) => setMontantEconomies(validateAndFormatNumber(e.target.value))}
                        className="w-[150px]"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
                  </div>

                  {/* Section Remboursements manuels - Solde positif */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Rembourser un crédit d'un colocataire</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAjoutRemboursementManuel}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un remboursement
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {remboursementsManuels.map((remboursement) => (
                        <div key={remboursement.id} className="flex items-center gap-3">
                          <Select
                            value={remboursement.colocataire}
                            onValueChange={(value) => handleUpdateRemboursementManuel(remboursement.id, { colocataire: value })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Choisir un colocataire" />
                            </SelectTrigger>
                            <SelectContent>
                              {colocataires.map((colocataire) => (
                                <SelectItem key={colocataire.nom} value={colocataire.nom}>
                                  {colocataire.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatNumberWithTwoDecimals(remboursement.montant)}
                            onChange={(e) => handleUpdateRemboursementManuel(
                              remboursement.id,
                              { montant: validateAndFormatNumber(e.target.value) }
                            )}
                            className="w-[150px]"
                          />
                          <span className="text-sm text-gray-500">€</span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRemboursementManuel(remboursement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Section Prélèvement économies - Solde négatif */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">🪙 Puiser dans les économies de la coloc</h3>
                    <p className="text-sm text-gray-600">
                      Économies disponibles : {formatCurrency(economiesDisponibles)} €
                    </p>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="montant-prelevement">💬 Montant à prélever des économies :</Label>
                      <Input
                        id="montant-prelevement"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formatNumberWithTwoDecimals(montantPrelevement)}
                        onChange={(e) => setMontantPrelevement(validateAndFormatNumber(e.target.value))}
                        className="w-[150px]"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
                  </div>

                  {/* Section Ajout crédits - Solde négatif */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">👤 Ajouter au crédit d'un colocataire</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAjoutCredit}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une ligne de crédit
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {creditsColocatairesAjout.map((credit) => (
                        <div key={credit.id} className="flex items-center gap-3">
                          <Select
                            value={credit.colocataire}
                            onValueChange={(value) => handleUpdateCredit(credit.id, { colocataire: value })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Choisir un colocataire" />
                            </SelectTrigger>
                            <SelectContent>
                              {colocataires.map((colocataire) => (
                                <SelectItem key={colocataire.nom} value={colocataire.nom}>
                                  {colocataire.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatNumberWithTwoDecimals(credit.montant)}
                            onChange={(e) => handleUpdateCredit(
                              credit.id,
                              { montant: validateAndFormatNumber(e.target.value) }
                            )}
                            className="w-[150px]"
                          />
                          <span className="text-sm text-gray-500">€</span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCredit(credit.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Validation */}
              {!isAllocationValide && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    {summary?.soldeGlobal >= 0 ? (
                      "Le total des allocations doit égaler le solde positif."
                    ) : (
                      "❌ Le total des allocations doit compenser le déficit."
                    )}
                    <br />
                    <span className="font-medium">
                      Écart restant : {formatCurrency(Math.abs(ecartRestant))} €
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAjustementEcartOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleValidateAjustement}
                disabled={!isAllocationValide}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pop-up de confirmation finale */}
        <Dialog open={isFinalConfirmationOpen} onOpenChange={setIsFinalConfirmationOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Confirmation finale</DialogTitle>
              <DialogDescription>
                Vérifiez les détails avant de clôturer le mois
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Résumé du mois */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">📊 Résumé du mois</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total des dépenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary?.totalDepenses || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total des cotisations</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary?.totalCotisations || 0)}
                    </p>
                  </div>
                  <div className="col-span-1 md:col-span-2 bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Solde final</p>
                    <p className={`text-2xl font-bold ${(summary?.soldeGlobal || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary?.soldeGlobal || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tableau des remboursements */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-900 mb-4">💸 Remboursements à effectuer</h3>
                <div className="space-y-4">
                  {Array.from(remboursementsFinaux.entries()).map(([colocataire, montantFinal]) => {
                    if (montantFinal <= 0) return null;
                    const montantInitial = montantsModifies[colocataire] || 0;
                    const remboursementManuel = remboursementsManuels.find(r => r.colocataire === colocataire)?.montant || 0;
                    const creditAjoute = creditsColocatairesAjout.find(c => c.colocataire === colocataire)?.montant || 0;

                    return (
                      <div key={colocataire} className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{colocataire}</h4>
                        <div className="space-y-1 text-sm">
                          {montantInitial > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remboursement initial :</span>
                              <span>{formatCurrency(montantInitial)}</span>
                            </div>
                          )}
                          {remboursementManuel > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remboursement ajouté :</span>
                              <span className="text-green-600">+{formatCurrency(remboursementManuel)}</span>
                            </div>
                          )}
                          {creditAjoute > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Crédit déduit :</span>
                              <span className="text-red-600">-{formatCurrency(creditAjoute)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t mt-2">
                            <span className="font-semibold">Montant final :</span>
                            <span className="font-bold text-purple-600">{formatCurrency(montantFinal)} €</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section économies */}
              {(montantEconomies > 0 || montantPrelevement > 0) && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">💰 Économies</h3>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-lg">
                      {montantEconomies > 0 ? (
                        <>
                          <span className="text-gray-700">Montant ajouté aux économies : </span>
                          <span className="font-bold text-green-600">+{formatCurrency(montantEconomies)} €</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-700">Montant prélevé des économies : </span>
                          <span className="font-bold text-red-600">-{formatCurrency(montantPrelevement)} €</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Message de confirmation */}
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800 flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span className="font-semibold">Confirmez-vous ces remboursements ?</span>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Une fois validé, le mois sera clôturé et ces montants seront enregistrés.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsFinalConfirmationOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="outline"
                onClick={handleSendRecap}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Mail className="h-4 w-4 mr-2" />
                ✉️ Envoyer le récap du mois
              </Button>
              <Button 
                onClick={handleFinalConfirmation}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                ✅ Confirmer la clôture
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modals */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          monthKey={monthKey}
        />

        <AddCotisationModal
          isOpen={isAddCotisationModalOpen}
          onClose={() => setIsAddCotisationModalOpen(false)}
          monthKey={monthKey}
        />

        {selectedTransaction && (
          <EditTransactionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedTransaction(null);
            }}
            monthKey={monthKey}
            transaction={selectedTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default MonthDetail;

