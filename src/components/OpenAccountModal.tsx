import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  Camera,
  Clock,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/audio';
import { DocumentCapture } from './DocumentCapture';
import { AccountApplication, UserAddress, ApplicationStatus } from '../types';
import { 
  submitAccountApplication, 
  getLocalUserApplication, 
  subscribeToUserApplication,
  saveRegistrationDraft,
  getRegistrationDraft,
  clearRegistrationDraft
} from '../services/firebaseBankService';
import { auth } from '../firebase/config';

interface OpenAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (name: string, email: string, cpf?: string, phone?: string) => void;
  onGoogleSignIn?: () => Promise<void>;
  onOpenLogin?: () => void;
  onApplicationSubmitted?: (app: AccountApplication) => void;
  initialIdentifier?: { email?: string; cpf?: string };
}

export const OpenAccountModal: React.FC<OpenAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
  onGoogleSignIn,
  onOpenLogin,
  onApplicationSubmitted,
  initialIdentifier
}) => {
  // Wizard steps: 1 = Dados & Endereço, 2 = Documento Frente e Verso, 3 = Selfie, 4 = Revisão e Envio
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 Fields
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Step 2 Fields: Documents
  const [docFrontPhoto, setDocFrontPhoto] = useState('');
  const [docBackPhoto, setDocBackPhoto] = useState('');

  // Step 3 Field: Face Selfie
  const [selfiePhoto, setSelfiePhoto] = useState('');

  // Application Status State
  const [existingApp, setExistingApp] = useState<AccountApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

  // Initialize and restore pre-saved draft or existing application
  useEffect(() => {
    if (!isOpen) return;

    // Check if current user already has an application
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      const local = getLocalUserApplication(currentUserId);
      if (local) {
        setExistingApp(local);
        if (local.status === 'needs_revision') {
          populateFieldsFromApp(local);
        }
        return;
      }

      const unsub = subscribeToUserApplication(currentUserId, (app) => {
        if (app) {
          setExistingApp(app);
          if (app.status === 'needs_revision') {
            populateFieldsFromApp(app);
          }
        }
      });
      return unsub;
    }

    // Otherwise, restore pre-saved draft so user doesn't lose any progress
    const draft = getRegistrationDraft();
    if (draft) {
      if (draft.fullName) setFullName(draft.fullName);
      if (draft.preferredName) setPreferredName(draft.preferredName);
      if (draft.cpf) setCpf(draft.cpf);
      if (draft.birthDate) setBirthDate(draft.birthDate);
      if (draft.email) setEmail(draft.email);
      if (draft.phone) setPhone(draft.phone);
      if (draft.cep) setCep(draft.cep);
      if (draft.street) setStreet(draft.street);
      if (draft.number) setNumber(draft.number);
      if (draft.complement) setComplement(draft.complement);
      if (draft.neighborhood) setNeighborhood(draft.neighborhood);
      if (draft.city) setCity(draft.city);
      if (draft.state) setState(draft.state);
      if (draft.docFrontPhoto) setDocFrontPhoto(draft.docFrontPhoto);
      if (draft.docBackPhoto) setDocBackPhoto(draft.docBackPhoto);
      if (draft.selfiePhoto) setSelfiePhoto(draft.selfiePhoto);
      if (draft.step) setStep(draft.step);
      setHasDraftRestored(true);
    }

    // Pre-fill from initialIdentifier if passed
    if (initialIdentifier?.email && !email) {
      setEmail(initialIdentifier.email);
    }
    if (initialIdentifier?.cpf && !cpf) {
      setCpf(initialIdentifier.cpf);
    }
  }, [isOpen]);

  // CONTINUOUS AUTO-SAVE: Pre-save all fields, pictures and step to localStorage
  useEffect(() => {
    if (!isOpen || existingApp?.status === 'approved' || isSubmittedSuccess) return;

    // Only save if at least something has been entered
    if (
      fullName ||
      cpf ||
      email ||
      phone ||
      cep ||
      street ||
      docFrontPhoto ||
      docBackPhoto ||
      selfiePhoto
    ) {
      saveRegistrationDraft({
        step,
        fullName,
        preferredName,
        cpf,
        birthDate,
        email,
        phone,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        docFrontPhoto,
        docBackPhoto,
        selfiePhoto
      });
    }
  }, [
    isOpen,
    step,
    fullName,
    preferredName,
    cpf,
    birthDate,
    email,
    phone,
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    docFrontPhoto,
    docBackPhoto,
    selfiePhoto,
    existingApp,
    isSubmittedSuccess
  ]);

  const populateFieldsFromApp = (app: AccountApplication) => {
    setFullName(app.fullName || '');
    setPreferredName(app.preferredName || '');
    setCpf(app.cpf || '');
    setBirthDate(app.birthDate || '');
    setEmail(app.email || '');
    setPhone(app.phone || '');
    if (app.address) {
      setCep(app.address.cep || '');
      setStreet(app.address.street || '');
      setNumber(app.address.number || '');
      setComplement(app.address.complement || '');
      setNeighborhood(app.address.neighborhood || '');
      setCity(app.address.city || '');
      setState(app.address.state || '');
    }
    if (app.docFrontPhoto) setDocFrontPhoto(app.docFrontPhoto);
    if (app.docBackPhoto) setDocBackPhoto(app.docBackPhoto);
    if (app.selfiePhoto) setSelfiePhoto(app.selfiePhoto);
  };

  // Mask Helpers
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    const masked = raw
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(masked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    const masked = raw.length > 10
      ? raw.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      : raw.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    setPhone(masked);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    const masked = raw.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    setCep(masked);

    if (raw.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || '');
        }
      } catch (err) {
        console.warn('ViaCep error:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setErrorMessage(null);
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setErrorMessage('Por favor, informe seu nome e sobrenome completos.');
      return false;
    }
    if (!preferredName.trim()) {
      setErrorMessage('Informe como gostaria de ser chamado.');
      return false;
    }
    if (!birthDate) {
      setErrorMessage('Informe sua data de nascimento.');
      return false;
    }
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      setErrorMessage('Informe um CPF válido com 11 dígitos.');
      return false;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return false;
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Informe seu celular WhatsApp com DDD.');
      return false;
    }
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setErrorMessage('Informe um CEP válido.');
      return false;
    }
    if (!street.trim()) {
      setErrorMessage('Informe o nome da rua / logradouro.');
      return false;
    }
    if (!number.trim()) {
      setErrorMessage('Informe o número da residência.');
      return false;
    }
    if (!neighborhood.trim()) {
      setErrorMessage('Informe o bairro.');
      return false;
    }
    return true;
  };

  // Step 2 Validation (Document Front and Back)
  const validateStep2 = (): boolean => {
    setErrorMessage(null);
    if (!docFrontPhoto) {
      setErrorMessage('É obrigatório tirar ou anexar a foto da FRENTE do documento (RG ou CNH).');
      return false;
    }
    if (!docBackPhoto) {
      setErrorMessage('É obrigatório tirar ou anexar a foto do VERSO do documento (RG ou CNH).');
      return false;
    }
    return true;
  };

  // Step 3 Validation (Face Selfie)
  const validateStep3 = (): boolean => {
    setErrorMessage(null);
    if (!selfiePhoto) {
      setErrorMessage('É obrigatório tirar uma foto do seu rosto (selfie biométrica).');
      return false;
    }
    return true;
  };

  // Handle final submission to Admin
  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const userId = auth.currentUser?.uid || `guest-${Date.now()}`;
    const address: UserAddress = {
      cep,
      street,
      number,
      complement,
      neighborhood,
      city: city || 'São Paulo',
      state: state || 'SP'
    };

    try {
      const app = await submitAccountApplication({
        userId,
        fullName: fullName.trim(),
        preferredName: preferredName.trim(),
        birthDate,
        cpf: cpf.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address,
        docFrontPhoto,
        docBackPhoto,
        selfiePhoto
      });

      setExistingApp(app);
      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
      clearRegistrationDraft();
      onApplicationSubmitted?.(app);
      soundEffects.playPixSuccess();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00e676', '#a3e635', '#ffffff']
      });
    } catch (err: unknown) {
      console.error('Application submit error:', err);
      setIsSubmitting(false);
      setErrorMessage('Ocorreu um erro ao enviar sua proposta. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-[#0c120e] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_70px_rgba(0,230,118,0.25)] text-white relative my-auto max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* =========================================================================
            STATE A: EXISTING APPLICATION IN REVIEW OR NEEDING REVISION
            ========================================================================= */}
        {existingApp && !isSubmittedSuccess && (
          <div className="py-2 space-y-4">
            {/* Status Header Badge */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                existingApp.status === 'pending'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : existingApp.status === 'needs_revision'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              }`}>
                {existingApp.status === 'pending' && <Clock className="w-6 h-6 animate-pulse" />}
                {existingApp.status === 'needs_revision' && <AlertCircle className="w-6 h-6" />}
                {existingApp.status === 'approved' && <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  {existingApp.status === 'pending' && 'Proposta em Análise pelo Administrador'}
                  {existingApp.status === 'needs_revision' && 'Ajuste Solicitado pelo Administrador'}
                  {existingApp.status === 'approved' && 'Conta LeadsPay Aprovada!'}
                </h3>
                <p className="text-xs text-slate-400">
                  {existingApp.status === 'pending' && 'Nossa equipe de compliance está avaliando seus dados e documentos.'}
                  {existingApp.status === 'needs_revision' && 'O administrador solicitou a revisão de informações abaixo.'}
                  {existingApp.status === 'approved' && 'Parabéns! Sua conta já está liberada para acesso.'}
                </p>
              </div>
            </div>

            {/* Admin Revision Notes Alert */}
            {existingApp.status === 'needs_revision' && existingApp.revisionNotes && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Mensagem do Administrador:
                </span>
                <p className="text-xs text-white bg-black/40 p-2.5 rounded-xl border border-white/10 font-mono">
                  "{existingApp.revisionNotes}"
                </p>
                {existingApp.requestedRevisions && existingApp.requestedRevisions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-300 block mb-1 font-medium">Itens a corrigir:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {existingApp.requestedRevisions.map((rev, i) => (
                        <span key={i} className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                          {rev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExistingApp(null);
                      setStep(1);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#a3e635] hover:bg-[#92d628] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Corrigir Proposta e Reenviar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pending Details Summary */}
            {existingApp.status === 'pending' && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-400">Titular</span>
                  <span className="font-semibold text-white">{existingApp.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-400">Como quer ser chamado</span>
                  <span className="font-semibold text-[#00e676]">{existingApp.preferredName}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-400">CPF</span>
                  <span className="font-mono text-white">{existingApp.cpf}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-400">Endereço</span>
                  <span className="text-right text-slate-300 max-w-[200px] truncate">
                    {existingApp.address.street}, {existingApp.address.number} - {existingApp.address.neighborhood}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Documentos</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <FileCheck className="w-3.5 h-3.5" /> Frente, Verso e Selfie Enviados
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#00e676] font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Prazo de Validação: 24 a 48 horas úteis</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Sua proposta está sendo avaliada com rigor de segurança. O acesso à conta será liberado após a aprovação da administração.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Entendi, vou aguardar
                </button>
              </div>
            )}

            {/* Approved View */}
            {existingApp.status === 'approved' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <p className="text-xs text-emerald-300">
                  Sua conta foi aprovada com sucesso! Você já pode acessar seu saldo e funcionalidades.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin?.();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(0,230,118,0.4)] cursor-pointer"
                >
                  Acessar Minha Conta Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STATE B: NEW APPLICATION OR EDITING PROPOSAL FLOW
            ========================================================================= */}
        {(!existingApp || existingApp.status === 'needs_revision') && !isSubmittedSuccess && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Abrir Conta LeadsPay</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Etapa {step} de 4
                  </span>
                  {hasDraftRestored && (
                    <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-[#00e676]" />
                      <span>Pré-salvo restaurado</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {step === 1 && 'Preencha seus dados pessoais e de endereço'}
                  {step === 2 && 'Envie a foto da frente e do verso do seu documento'}
                  {step === 3 && 'Tire uma selfie nítida do seu rosto para validação biométrica'}
                  {step === 4 && 'Revise as informações e envie para validação de segurança'}
                </p>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 mb-4 shrink-0">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s ? 'bg-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.5)]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-left">
              {/* =========================================================================
                  STEP 1: DADOS PESSOAIS & ENDEREÇO
                  ========================================================================= */}
              {step === 1 && (
                <div className="space-y-3.5">
                  {/* Nome Completo */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Nome Completo <span className="text-[#00e676]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Eduardo de Oliveira"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Como quer ser chamado & Data de Nascimento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Como quer ser chamado <span className="text-[#00e676]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Cadu, Eduardo"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Data de Nascimento <span className="text-[#00e676]">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          required
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CPF & Celular WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        CPF <span className="text-[#00e676]">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="000.000.000-00"
                          value={cpf}
                          onChange={handleCpfChange}
                          className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Celular com DDD (WhatsApp) <span className="text-[#00e676]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      E-mail Principal <span className="text-[#00e676]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* ENDEREÇO SECTION */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[11px] font-semibold text-[#00e676] uppercase tracking-wider block mb-2">
                      Endereço Residencial
                    </span>

                    {/* CEP & Bairro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          CEP <span className="text-[#00e676]">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="00000-000"
                            value={cep}
                            onChange={handleCepChange}
                            className="w-full pl-9 pr-8 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                          />
                          {isLoadingCep && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Bairro <span className="text-[#00e676]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Pinheiros, Centro"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Rua e Número */}
                    <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                      <div className="col-span-2">
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Rua / Avenida <span className="text-[#00e676]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Rua das Flores"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Número <span className="text-[#00e676]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Complemento & Cidade/UF */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 block mb-1">
                          Complemento (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Apto 42, Bloco B"
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[11px] font-medium text-slate-300 block mb-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            placeholder="São Paulo"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-300 block mb-1">
                            UF
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="SP"
                            value={state}
                            onChange={(e) => setState(e.target.value.toUpperCase())}
                            className="w-full px-2 py-2 bg-black/60 border border-white/10 focus:border-[#00e676] rounded-xl text-xs text-white placeholder:text-slate-600 outline-none uppercase font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 2: FOTOS DO DOCUMENTO (FRENTE E VERSO)
                  ========================================================================= */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <p className="font-semibold mb-0.5">Dicas para aprovação rápida:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                      <li>Retire o documento do plástico de proteção.</li>
                      <li>Evite reflexos de luz e certifique-se de que os 4 cantos estão visíveis.</li>
                      <li>Aceitamos RG, CNH ou RNE dentro da validade.</li>
                    </ul>
                  </div>

                  {/* Foto da Frente */}
                  <DocumentCapture
                    type="front"
                    title="1. Foto da Frente do Documento"
                    description="Posicione a frente do seu RG ou CNH (lado da foto)"
                    currentPhoto={docFrontPhoto}
                    onPhotoCaptured={(photo) => setDocFrontPhoto(photo)}
                  />

                  {/* Foto do Verso */}
                  <DocumentCapture
                    type="back"
                    title="2. Foto do Verso do Documento"
                    description="Posicione o verso do seu RG ou CNH (lado do CPF e filiação)"
                    currentPhoto={docBackPhoto}
                    onPhotoCaptured={(photo) => setDocBackPhoto(photo)}
                  />
                </div>
              )}

              {/* =========================================================================
                  STEP 3: FOTO DO ROSTO (SELFIE BIOMÉTRICA)
                  ========================================================================= */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <p className="font-semibold mb-0.5">Validação Facial Antifraude:</p>
                    <p className="text-[11px] text-slate-300">
                      Tire uma foto bem iluminada do seu rosto sem boné, óculos escuros ou máscara.
                    </p>
                  </div>

                  <DocumentCapture
                    type="selfie"
                    title="Foto do Rosto (Selfie)"
                    description="Olhe para a câmera e mantenha uma expressão neutra"
                    currentPhoto={selfiePhoto}
                    onPhotoCaptured={(photo) => setSelfiePhoto(photo)}
                  />
                </div>
              )}

              {/* =========================================================================
                  STEP 4: REVISÃO GERAL E ENVIO PARA O ADMIN
                  ========================================================================= */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <span className="text-xs font-semibold text-[#00e676] uppercase tracking-wider block">
                      Resumo da Proposta de Abertura
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Nome Completo</span>
                        <span className="font-medium text-white">{fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Nome Social / Apelido</span>
                        <span className="font-medium text-[#00e676]">{preferredName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-slate-400 block text-[11px]">CPF</span>
                        <span className="font-mono text-white">{cpf}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Data de Nascimento</span>
                        <span className="font-mono text-white">{birthDate}</span>
                      </div>
                    </div>

                    <div className="text-xs border-b border-white/10 pb-2.5">
                      <span className="text-slate-400 block text-[11px]">Endereço Completo</span>
                      <span className="text-white">
                        {street}, {number} {complement && `(${complement})`} - {neighborhood}, {city}/{state} - CEP: {cep}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-400 block text-[11px] mb-2">Comprovantes Registrados</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-white/10 p-1.5 bg-black/40 text-center">
                          <img src={docFrontPhoto} alt="Frente" className="h-16 w-full object-cover rounded mb-1" />
                          <span className="text-[10px] text-slate-300 block">Doc Frente</span>
                        </div>
                        <div className="rounded-lg border border-white/10 p-1.5 bg-black/40 text-center">
                          <img src={docBackPhoto} alt="Verso" className="h-16 w-full object-cover rounded mb-1" />
                          <span className="text-[10px] text-slate-300 block">Doc Verso</span>
                        </div>
                        <div className="rounded-lg border border-white/10 p-1.5 bg-black/40 text-center">
                          <img src={selfiePhoto} alt="Selfie" className="h-16 w-full object-cover rounded mb-1" />
                          <span className="text-[10px] text-slate-300 block">Selfie Facial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 shrink-0 text-[#00e676] mt-0.5" />
                    <div className="space-y-1 text-left">
                      <span className="font-semibold text-white block">Envio para Validação de Segurança</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Sua proposta será enviada para validação e auditoria de conformidade. O prazo de aprovação é de <strong>24 a 48 horas úteis</strong>. Após a aprovação da administração, sua conta corrente e cartões serão liberados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-white/10 mt-3 flex items-center justify-between gap-3 shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && validateStep1()) setStep(2);
                    if (step === 2 && validateStep2()) setStep(3);
                    if (step === 3 && validateStep3()) setStep(4);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all cursor-pointer"
                >
                  <span>Próxima Etapa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(0,230,118,0.5)] transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Enviando Proposta...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Enviar para Análise</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Already has account link */}
            {onOpenLogin && step === 1 && (
              <div className="mt-3 text-center shrink-0">
                <p className="text-xs text-slate-400">
                  Já tem uma conta LeadsPay?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="text-[#a3e635] font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Acessar conta
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STATE C: SUBMITTED SUCCESS SCREEN
            ========================================================================= */}
        {isSubmittedSuccess && (
          <div className="py-8 text-center space-y-4 my-auto">
            <div className="w-20 h-20 rounded-full bg-[#00e676]/20 border border-[#00e676] flex items-center justify-center text-[#00e676] mx-auto shadow-[0_0_40px_rgba(0,230,118,0.6)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-white mb-1">
                Proposta Enviada com Sucesso!
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Seus dados cadastrais, fotos do documento e validação facial foram enviados para a equipe de compliance do administrador.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 max-w-sm mx-auto text-left space-y-1.5 text-xs">
              <span className="text-slate-300 block text-[11px] font-semibold">Validação e Auditoria de Segurança:</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Prazo de análise:</span>
                <span className="font-mono text-[#00e676] font-bold">24 a 48 horas úteis</span>
              </div>
              <p className="text-[11px] text-slate-300 pt-0.5 leading-relaxed">
                Suas informações foram salvas e enviadas para conferência. A aprovação da administração é necessária para liberar o acesso ao LeadsPay.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSubmittedSuccess(false);
                  onClose();
                }}
                className="w-full max-w-xs py-3 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs transition-all shadow-md cursor-pointer mx-auto block"
              >
                Concluir e Acompanhar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
