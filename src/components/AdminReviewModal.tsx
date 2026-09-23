import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Eye, 
  Check, 
  Send, 
  ExternalLink,
  Sparkles,
  Camera,
  MessageSquare,
  Filter,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Upload,
  Play,
  RotateCcw,
  CheckCheck,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';
import { AccountApplication, ApplicationStatus } from '../types';
import { 
  ADMIN_EMAIL, 
  getLocalApplications, 
  subscribeToAllApplications, 
  approveApplicationAndCreateAccount, 
  requestApplicationRevision, 
  rejectApplication,
  saveLocalApplications,
  clearFakeApplications,
  getLocalLoginBanners,
  saveLoginBannersToFirestore,
  DEFAULT_LOGIN_BANNERS
} from '../services/firebaseBankService';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  onApplicationApproved?: (app: AccountApplication) => void;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onApplicationApproved
}) => {
  // Navigation tabs in Admin: KYC Review vs Login Screen Banners
  const [adminTab, setAdminTab] = useState<'kyc' | 'banners'>('kyc');

  // KYC Review State
  const [applications, setApplications] = useState<AccountApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<AccountApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | ApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Banners Management State (3 automatic cycling images for login/access screen)
  const [banners, setBanners] = useState<[string, string, string]>(() => getLocalLoginBanners());
  const [previewSlide, setPreviewSlide] = useState(0);
  const [isSavingBanners, setIsSavingBanners] = useState(false);

  // Revision Modal State
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedRevisionFields, setSelectedRevisionFields] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const isAdmin = currentUserEmail?.toLowerCase().trim() === ADMIN_EMAIL;

  // Load and subscribe to real customer applications without any fake/demo seeding
  useEffect(() => {
    if (!isOpen) return;

    // Purge fake mock data so admin starts completely clean
    clearFakeApplications();

    const initialApps = getLocalApplications();
    setApplications(initialApps);
    setSelectedApp(initialApps[0] || null);

    const unsub = subscribeToAllApplications((apps) => {
      setApplications(apps);
      if (selectedApp) {
        const updated = apps.find(a => a.id === selectedApp.id || a.userId === selectedApp.userId);
        if (updated) setSelectedApp(updated);
        else setSelectedApp(apps[0] || null);
      } else if (apps.length > 0) {
        setSelectedApp(apps[0]);
      }
    });

    return unsub;
  }, [isOpen]);

  // Preview carousel for banners tab
  useEffect(() => {
    if (adminTab !== 'banners') return;
    const interval = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, [adminTab]);

  if (!isOpen) return null;

  // If not admin, block view
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0c120e] border border-rose-500/40 rounded-3xl p-6 text-center text-white relative shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">Acesso Restrito ao Administrador</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Este painel gerencial de aprovação de contas é exclusivo para o administrador oficial:
            <span className="font-mono text-emerald-400 block mt-1 font-semibold">{ADMIN_EMAIL}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Você está conectado como: <span className="font-mono text-white">{currentUserEmail || 'Visitante não logado'}</span>
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesFilter = filterStatus === 'all' ? true : app.status === filterStatus;
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.cpf.includes(searchQuery) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const revisionCount = applications.filter(a => a.status === 'needs_revision').length;

  // Admin Action: Approve Account
  const handleApprove = async (app: AccountApplication) => {
    try {
      await approveApplicationAndCreateAccount(app);
      soundEffects.playPixSuccess();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff']
      });
      setActionSuccessMsg(`Conta de ${app.fullName} APROVADA com sucesso!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      onApplicationApproved?.(app);
    } catch (err) {
      console.error('Error approving application:', err);
    }
  };

  // Admin Action: Request Revision
  const handleSendRevision = async () => {
    if (!selectedApp || !revisionNotes.trim()) return;

    try {
      await requestApplicationRevision(
        selectedApp.id,
        selectedApp.userId,
        revisionNotes.trim(),
        selectedRevisionFields
      );
      soundEffects.playPixSuccess();
      setIsRevisionOpen(false);
      setRevisionNotes('');
      setSelectedRevisionFields([]);
      setActionSuccessMsg(`Solicitação de ajuste enviada para ${selectedApp.fullName}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error requesting revision:', err);
    }
  };

  // Clear demo / mock entries manually
  const handleCleanFakeData = () => {
    clearFakeApplications();
    const clean = getLocalApplications();
    setApplications(clean);
    setSelectedApp(clean[0] || null);
    setActionSuccessMsg('Dados fakes e de teste foram limpos com sucesso.');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Toggle field to revise
  const toggleRevisionField = (field: string) => {
    setSelectedRevisionFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  // Image Upload handler for Banners (converts file to Base64 Data URL)
  const handleBannerFileUpload = (index: 0 | 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 4MB
    if (file.size > 4 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBanners(prev => {
          const next: [string, string, string] = [...prev];
          next[index] = dataUrl;
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUrlChange = (index: 0 | 1 | 2, url: string) => {
    setBanners(prev => {
      const next: [string, string, string] = [...prev];
      next[index] = url;
      return next;
    });
  };

  const handleResetBannerToDefault = (index: 0 | 1 | 2) => {
    setBanners(prev => {
      const next: [string, string, string] = [...prev];
      next[index] = DEFAULT_LOGIN_BANNERS[index];
      return next;
    });
  };

  const handleSaveAllBanners = async () => {
    setIsSavingBanners(true);
    try {
      await saveLoginBannersToFirestore(banners);
      soundEffects.playPixSuccess();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff']
      });
      setActionSuccessMsg('As 3 imagens foram salvas e publicadas na tela de login com sucesso!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving banners:', err);
      setActionSuccessMsg('Erro ao salvar banners na nuvem.');
    } finally {
      setIsSavingBanners(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-5xl h-[92vh] max-h-[880px] bg-[#090d0b] border border-emerald-500/40 rounded-3xl shadow-[0_0_80px_rgba(0,230,118,0.25)] text-white flex flex-col overflow-hidden relative"
      >
        {/* TOP BAR */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-white">
                  Painel de Administração LeadsPay
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-[#00e676] border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logado como: <span className="font-mono text-emerald-400 font-semibold">{ADMIN_EMAIL}</span>
              </p>
            </div>
          </div>

          {/* MAIN TABS SELECTOR: KYC vs BANNERS */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-2xl">
            <button
              onClick={() => setAdminTab('kyc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                adminTab === 'kyc'
                  ? 'bg-[#00e676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Análise KYC & Contas</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('banners')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                adminTab === 'banners'
                  ? 'bg-[#00e676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Imagens da Tela Inicial (3 Banners)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {actionSuccessMsg && (
          <div className="px-5 py-2.5 bg-[#00e676] text-black text-xs font-bold flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: KYC & ACCOUNTS REVIEW */}
        {adminTab === 'kyc' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* LEFT LIST PANEL (Cols 5) */}
            <div className="md:col-span-5 border-r border-white/10 flex flex-col h-full bg-black/30 overflow-hidden">
              {/* KPI STATS */}
              <div className="p-3 border-b border-white/10 grid grid-cols-3 gap-2 bg-black/40 shrink-0">
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block">Pendentes</span>
                  <span className="text-base font-bold text-amber-400 font-mono">{pendingCount}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    filterStatus === 'approved'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block">Aprovadas</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{approvedCount}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('needs_revision')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    filterStatus === 'needs_revision'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider block">Em Ajuste</span>
                  <span className="text-base font-bold text-rose-400 font-mono">{revisionCount}</span>
                </button>
              </div>

              {/* SEARCH & FILTER */}
              <div className="p-3 border-b border-white/10 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Filtrar:</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'pending', 'approved', 'needs_revision'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-2 py-0.5 rounded-lg capitalize ${
                          filterStatus === s
                            ? 'bg-emerald-500/20 text-[#00e676] font-semibold'
                            : 'hover:text-white'
                        }`}
                      >
                        {s === 'all' ? 'Todos' : s === 'needs_revision' ? 'Ajustes' : s}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCleanFakeData}
                    className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors ml-2 cursor-pointer"
                    title="Remover dados de teste locais"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpar testes</span>
                  </button>
                </div>
              </div>

              {/* APPLICATION CARDS LIST */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredApps.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full">
                    <ShieldAlert className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400 text-sm">Nenhuma proposta encontrada</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                      Quando novos usuários abrirem conta pelo aplicativo, suas propostas com selfie e documentos aparecerão aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = selectedApp?.id === app.id;
                    const statusColors = {
                      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      needs_revision: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                      rejected: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    }[app.status];

                    const statusLabels = {
                      pending: 'Pendente',
                      approved: 'Aprovada',
                      needs_revision: 'Ajuste Solicitado',
                      rejected: 'Recusada'
                    }[app.status];

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-l-4 border-l-[#00e676]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">
                              {app.fullName}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${statusColors} uppercase font-semibold shrink-0`}>
                              {statusLabels}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400">
                            CPF: {app.cpf}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {app.email}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {new Date(app.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT DETAIL PANEL (Cols 7) */}
            <div className="md:col-span-7 flex flex-col h-full bg-[#070b09] overflow-y-auto">
              {selectedApp ? (
                <div className="p-6 space-y-6">
                  {/* Top Candidate Summary */}
                  <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white font-display">
                          {selectedApp.fullName}
                        </h3>
                        {selectedApp.preferredName && selectedApp.preferredName !== selectedApp.fullName && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Chamado: "{selectedApp.preferredName}"
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="font-mono">CPF: {selectedApp.cpf}</span>
                        <span>·</span>
                        <span>Nasc: {selectedApp.birthDate}</span>
                      </p>
                    </div>

                    {/* Status badge and quick actions */}
                    <div className="flex items-center gap-2">
                      {selectedApp.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsRevisionOpen(true)}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Pedir Ajuste</span>
                          </button>

                          <button
                            onClick={() => handleApprove(selectedApp)}
                            className="px-4 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,230,118,0.4)] transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-black" />
                            <span>Aprovar Conta</span>
                          </button>
                        </div>
                      )}

                      {selectedApp.status === 'approved' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
                          <span>Conta Ativa & Aprovada</span>
                        </div>
                      )}

                      {selectedApp.status === 'needs_revision' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>Aguardando Envio de Ajustes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KYC DOCUMENTS & PHOTOS SECTION */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#00e676]" />
                      <span>Documentos & Foto Facial (Selfie)</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Document Front */}
                      <div className="p-3 bg-black/60 border border-white/10 rounded-2xl space-y-2 group">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Doc. Frente (RG / CNH)</span>
                          <button
                            onClick={() => setZoomedImage({ url: selectedApp.docFrontPhoto, title: 'Frente do Documento' })}
                            className="text-[#00e676] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ampliar</span>
                          </button>
                        </div>
                        <div
                          onClick={() => setZoomedImage({ url: selectedApp.docFrontPhoto, title: 'Frente do Documento' })}
                          className="w-full h-32 rounded-xl overflow-hidden bg-black/80 border border-white/5 relative cursor-pointer"
                        >
                          <img
                            src={selectedApp.docFrontPhoto}
                            alt="Frente Documento"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </div>

                      {/* Document Back */}
                      <div className="p-3 bg-black/60 border border-white/10 rounded-2xl space-y-2 group">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Doc. Verso</span>
                          <button
                            onClick={() => setZoomedImage({ url: selectedApp.docBackPhoto, title: 'Verso do Documento' })}
                            className="text-[#00e676] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ampliar</span>
                          </button>
                        </div>
                        <div
                          onClick={() => setZoomedImage({ url: selectedApp.docBackPhoto, title: 'Verso do Documento' })}
                          className="w-full h-32 rounded-xl overflow-hidden bg-black/80 border border-white/5 relative cursor-pointer"
                        >
                          <img
                            src={selectedApp.docBackPhoto}
                            alt="Verso Documento"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </div>

                      {/* Selfie */}
                      <div className="p-3 bg-black/60 border border-white/10 rounded-2xl space-y-2 group">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Foto do Rosto (Selfie)</span>
                          <button
                            onClick={() => setZoomedImage({ url: selectedApp.selfiePhoto, title: 'Selfie do Cliente' })}
                            className="text-[#00e676] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ampliar</span>
                          </button>
                        </div>
                        <div
                          onClick={() => setZoomedImage({ url: selectedApp.selfiePhoto, title: 'Selfie do Cliente' })}
                          className="w-full h-32 rounded-xl overflow-hidden bg-black/80 border border-white/5 relative cursor-pointer"
                        >
                          <img
                            src={selectedApp.selfiePhoto}
                            alt="Selfie Facial"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONTACT & RESIDENTIAL ADDRESS */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Contacts */}
                    <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3">
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>Contato & Acesso</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">E-mail:</span>
                          <span className="font-mono text-white select-all">{selectedApp.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Telefone:</span>
                          <span className="font-mono text-white select-all">{selectedApp.phone || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Data de Envio:</span>
                          <span className="text-slate-300">
                            {new Date(selectedApp.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3">
                      <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>Endereço Residencial</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <p className="text-white font-medium">
                          {selectedApp.address.street}, {selectedApp.address.number}
                          {selectedApp.address.complement && ` · ${selectedApp.address.complement}`}
                        </p>
                        <p className="text-slate-400">
                          {selectedApp.address.neighborhood} — {selectedApp.address.city}/{selectedApp.address.state}
                        </p>
                        <p className="font-mono text-slate-500">
                          CEP: {selectedApp.address.cep}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PREVIOUS REVISION NOTES (IF ANY) */}
                  {selectedApp.revisionNotes && (
                    <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <MessageSquare className="w-4 h-4" />
                        <span>Instruções de Ajuste Enviadas ao Cliente:</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {selectedApp.revisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <User className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="font-bold text-slate-300">Selecione uma proposta na lista ao lado</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Clique em um cliente para revisar a documentação, foto de selfie, dados cadastrais e realizar a aprovação.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOGIN BANNERS MANAGER (3 IMAGES THAT CYCLE AUTOMATICALLY) */}
        {adminTab === 'banners' && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#070b09] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#00e676]" />
                  <span>Imagens da Tela de Acessar a Conta</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Defina as <strong>3 imagens</strong> que ficarão passando de forma automática em carrossel na tela de login. Você pode carregar uma foto do seu dispositivo ou colar a URL de qualquer imagem.
                </p>
              </div>

              <button
                onClick={handleSaveAllBanners}
                disabled={isSavingBanners}
                className="px-5 py-2.5 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isSavingBanners ? 'Salvando...' : 'Salvar e Publicar Banners'}</span>
              </button>
            </div>

            {/* LIVE PREVIEW OF THE 3 IMAGES IN ACTION */}
            <div className="p-4 bg-black/60 border border-emerald-500/30 rounded-3xl flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-64 h-44 rounded-2xl overflow-hidden relative shadow-2xl shrink-0 border border-white/10">
                <img
                  src={banners[previewSlide] || DEFAULT_LOGIN_BANNERS[previewSlide]}
                  alt={`Preview ${previewSlide + 1}`}
                  className="w-full h-full object-cover object-center transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Preview: Imagem {previewSlide + 1} de 3
                  </span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx === previewSlide ? 'bg-[#00e676]' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Play className="w-3.5 h-3.5" />
                  <span>Transição Automática Ativa</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  As imagens trocam suavemente a cada 4.5 segundos, com efeitos visuais escuros nas margens para garantir alta legibilidade de todos os botões e textos da tela de login.
                </p>
              </div>
            </div>

            {/* THE 3 SLOTS CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((idx) => {
                const slotIndex = idx as 0 | 1 | 2;
                const slotTitles = [
                  'Imagem 1 (Principal)',
                  'Imagem 2 (Pagamentos & LeadsTap)',
                  'Imagem 3 (Cartões & Tecnologia)'
                ];

                return (
                  <div
                    key={idx}
                    className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00e676]" />
                          {slotTitles[idx]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetBannerToDefault(slotIndex)}
                          className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                          title="Restaurar imagem padrão"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Padrão</span>
                        </button>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-black/80 border border-white/10 relative group mb-3">
                        <img
                          src={banners[slotIndex] || DEFAULT_LOGIN_BANNERS[slotIndex]}
                          alt={slotTitles[idx]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={() => setZoomedImage({ url: banners[slotIndex] || DEFAULT_LOGIN_BANNERS[slotIndex], title: slotTitles[idx] })}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 text-white hover:text-[#00e676] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Upload from device */}
                      <label className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors mb-2">
                        <Upload className="w-3.5 h-3.5 text-[#00e676]" />
                        <span>Carregar do Computador / Celular</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBannerFileUpload(slotIndex, e)}
                        />
                      </label>

                      {/* URL input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-medium">Ou informe a URL da imagem:</label>
                        <input
                          type="text"
                          placeholder="https://exemplo.com/foto.jpg"
                          value={banners[slotIndex]}
                          onChange={(e) => handleBannerUrlChange(slotIndex, e.target.value)}
                          className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL PEDIR AJUSTE AO CLIENTE */}
        {isRevisionOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0e1611] border border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Solicitar Ajuste ao Cliente</h3>
                </div>
                <button onClick={() => setIsRevisionOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                O cliente <strong>{selectedApp.fullName}</strong> receberá este aviso no aplicativo com orientações sobre o que precisa ser corrigido para aprovar a conta.
              </p>

              {/* Items requiring revision */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-300 block">
                  Marque o que precisa ser reenviado ou ajustado:
                </label>
                {[
                  { id: 'docFrontPhoto', label: 'Foto da Frente do Documento (ilegível, cortada ou reflexo)' },
                  { id: 'docBackPhoto', label: 'Foto do Verso do Documento (ilegível ou cortada)' },
                  { id: 'selfiePhoto', label: 'Foto do Rosto / Selfie (baixa iluminação ou não confere)' },
                  { id: 'address', label: 'Comprovante ou dados de Endereço Residencial' },
                  { id: 'personalData', label: 'Dados Cadastrais (CPF, Nome ou Data de Nascimento)' }
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleRevisionField(item.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedRevisionFields.includes(item.id)
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRevisionFields.includes(item.id)}
                      onChange={() => {}}
                      className="accent-[#00e676]"
                    />
                    <span className="text-[11px]">{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Instructions text */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Mensagem de Instrução para o Cliente:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: A foto da frente do seu documento ficou com reflexo de luz e não foi possível ler os dados. Por favor, tire uma nova foto com boa iluminação."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full p-2.5 bg-black/60 border border-white/10 focus:border-amber-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!revisionNotes.trim()}
                  onClick={handleSendRevision}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Solicitação</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN ZOOM MODAL */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] bg-[#0c120e] rounded-2xl border border-white/20 p-3 flex flex-col items-center">
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-xs font-semibold text-white my-2">{zoomedImage.title}</h4>
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
