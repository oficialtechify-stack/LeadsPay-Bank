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
  Trash2
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
  saveLocalApplications
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
  const [applications, setApplications] = useState<AccountApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<AccountApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | ApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Revision Modal State
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedRevisionFields, setSelectedRevisionFields] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const isAdmin = currentUserEmail?.toLowerCase().trim() === ADMIN_EMAIL;

  useEffect(() => {
    if (!isOpen) return;

    // Load initial applications
    const initialApps = getLocalApplications();
    if (initialApps.length === 0) {
      // Seed a realistic demonstration application so the admin can test immediately
      const demoApp: AccountApplication = {
        id: 'app-demo-1',
        userId: 'user-demo-1',
        fullName: 'Lucas Gabriel Ferreira Mendes',
        preferredName: 'Lucas Mendes',
        birthDate: '1996-08-14',
        cpf: '388.492.108-95',
        email: 'lucas.mendes@exemplo.com.br',
        phone: '(11) 98765-4321',
        address: {
          cep: '04543-011',
          street: 'Avenida Brigadeiro Faria Lima',
          number: '3477',
          complement: 'Conjunto 142',
          neighborhood: 'Itaim Bibi',
          city: 'São Paulo',
          state: 'SP'
        },
        docFrontPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        docBackPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        selfiePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveLocalApplications([demoApp]);
      setApplications([demoApp]);
      setSelectedApp(demoApp);
    } else {
      setApplications(initialApps);
      setSelectedApp(initialApps[0] || null);
    }

    const unsub = subscribeToAllApplications((apps) => {
      setApplications(apps);
      if (selectedApp) {
        const updated = apps.find(a => a.id === selectedApp.id || a.userId === selectedApp.userId);
        if (updated) setSelectedApp(updated);
      }
    });

    return unsub;
  }, [isOpen]);

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

  // Toggle field to revise
  const toggleRevisionField = (field: string) => {
    setSelectedRevisionFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
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
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-white">
                  Painel de Análise KYC & Compliance
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-[#00e676] border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  Admin LeadsPay
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logado como: <span className="font-mono text-emerald-400 font-semibold">{ADMIN_EMAIL}</span>
              </p>
            </div>
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

        {/* MAIN BODY: 2 PANELS */}
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
                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({applications.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'approved'
                      ? 'bg-emerald-400 text-black font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Aprovadas
                </button>
                <button
                  onClick={() => setFilterStatus('needs_revision')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'needs_revision'
                      ? 'bg-rose-400 text-black font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Ajustes
                </button>
              </div>
            </div>

            {/* APPLICATIONS LIST */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredApps.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Nenhuma solicitação encontrada neste filtro.
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isSelected = selectedApp?.id === app.id || selectedApp?.userId === app.userId;
                  return (
                    <div
                      key={app.id || app.userId}
                      onClick={() => setSelectedApp(app)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#00e676]/10 border-[#00e676]/60 shadow-[0_0_20px_rgba(0,230,118,0.15)]'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">{app.fullName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          app.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : app.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {app.status === 'pending' && 'Pendente'}
                          {app.status === 'approved' && 'Aprovada'}
                          {app.status === 'needs_revision' && 'Ajuste'}
                          {app.status === 'rejected' && 'Recusada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mb-1">
                        <span>CPF: {app.cpf}</span>
                        <span>•</span>
                        <span className="text-emerald-400">{app.preferredName}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{app.address.city}/{app.address.state}</span>
                        <span>{new Date(app.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT DETAIL PANEL (Cols 7) */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#0a0f0c] overflow-y-auto p-4 sm:p-5 text-left">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Header Profile Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/40 shrink-0 bg-black">
                      <img
                        src={selectedApp.selfiePhoto}
                        alt="Selfie"
                        className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setZoomedImage({ url: selectedApp.selfiePhoto, title: 'Selfie Facial do Titular' })}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedApp.fullName}</h3>
                      <p className="text-xs text-[#00e676] font-medium">
                        Chamado de: <span className="text-white font-semibold">{selectedApp.preferredName}</span>
                      </p>
                      <span className="text-[11px] text-slate-400 font-mono">Cadastrado em: {new Date(selectedApp.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* WhatsApp Quick Action */}
                  <a
                    href={`https://wa.me/55${selectedApp.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00e676] border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Status Notice if Needs Revision */}
                {selectedApp.status === 'needs_revision' && selectedApp.revisionNotes && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                      Ajuste solicitado anteriormente:
                    </span>
                    <p className="text-xs text-slate-200 font-mono bg-black/40 p-2 rounded-lg">
                      "{selectedApp.revisionNotes}"
                    </p>
                  </div>
                )}

                {/* Personal & Address Data Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Dados do Titular
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px] block">CPF:</span>
                      <span className="font-mono text-white font-semibold">{selectedApp.cpf}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Nascimento:</span>
                      <span className="text-white font-mono">{selectedApp.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">E-mail:</span>
                      <span className="text-white break-all">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Celular:</span>
                      <span className="text-white font-mono">{selectedApp.phone}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Endereço Completo
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Logradouro e Número:</span>
                      <span className="text-white font-semibold">
                        {selectedApp.address.street}, {selectedApp.address.number}
                        {selectedApp.address.complement && ` (${selectedApp.address.complement})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Bairro:</span>
                      <span className="text-white">{selectedApp.address.neighborhood}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cidade / Estado:</span>
                      <span className="text-white">{selectedApp.address.city} - {selectedApp.address.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">CEP:</span>
                      <span className="font-mono text-white">{selectedApp.address.cep}</span>
                    </div>
                  </div>
                </div>

                {/* HD Document Verification Gallery */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white tracking-wide uppercase">
                      Comprovação de Documentos & Biometria Facial
                    </span>
                    <span className="text-[10px] text-slate-400">Clique na foto para ampliar em tela cheia</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Doc Front */}
                    <div
                      onClick={() => setZoomedImage({ url: selectedApp.docFrontPhoto, title: 'Frente do Documento (RG / CNH)' })}
                      className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 p-2 cursor-pointer hover:border-emerald-500/50 transition-all text-center"
                    >
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-black mb-2 flex items-center justify-center">
                        <img
                          src={selectedApp.docFrontPhoto}
                          alt="Doc Frente"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-white">Doc Frente</span>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>

                    {/* Doc Back */}
                    <div
                      onClick={() => setZoomedImage({ url: selectedApp.docBackPhoto, title: 'Verso do Documento (RG / CNH)' })}
                      className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 p-2 cursor-pointer hover:border-emerald-500/50 transition-all text-center"
                    >
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-black mb-2 flex items-center justify-center">
                        <img
                          src={selectedApp.docBackPhoto}
                          alt="Doc Verso"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-white">Doc Verso</span>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>

                    {/* Face Selfie */}
                    <div
                      onClick={() => setZoomedImage({ url: selectedApp.selfiePhoto, title: 'Selfie Biométrica do Rosto' })}
                      className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 p-2 cursor-pointer hover:border-emerald-500/50 transition-all text-center"
                    >
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-black mb-2 flex items-center justify-center">
                        <img
                          src={selectedApp.selfiePhoto}
                          alt="Selfie"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold text-white">Selfie Facial</span>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADMIN ACTION BUTTONS BAR */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                  {selectedApp.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp)}
                      className="flex-1 py-3 px-5 rounded-2xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,230,118,0.4)] transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aceitar e Liberar Conta</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsRevisionOpen(true)}
                    className="py-3 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Mandar Preencher / Tirar Fotos de Novo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Selecione uma proposta na lista à esquerda para analisar.
              </div>
            )}
          </div>
        </div>

        {/* MODAL: SOLICITAR AJUSTE / REENVIAR FOTOS */}
        {isRevisionOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0c120e] border border-amber-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-sm font-bold">Solicitar Correção ao Cliente</h4>
                </div>
                <button
                  onClick={() => setIsRevisionOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Selecione o que precisa ser corrigido por <span className="font-semibold text-white">{selectedApp.fullName}</span>:
              </p>

              {/* Checkboxes */}
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'Foto da Frente do Documento', label: 'Foto da Frente do Documento (Ilegível/Reflexo)' },
                  { id: 'Foto do Verso do Documento', label: 'Foto do Verso do Documento (Cortada/Sem CPF)' },
                  { id: 'Selfie do Rosto', label: 'Selfie Facial (Pouca iluminação / Acessórios)' },
                  { id: 'Comprovante de Endereço / Número', label: 'Dados de Endereço ou Número da Residência' },
                  { id: 'Dados Pessoais / CPF', label: 'Dados Pessoais / Nome Completo' }
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
