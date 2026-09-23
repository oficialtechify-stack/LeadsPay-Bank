import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Send, 
  Headphones, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Bot, 
  CheckCheck,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface Support247ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
  time: string;
}

export const Support247Chat: React.FC<Support247ChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Olá! Sou o assistente 24/7 do LeadsPay Bank. Como posso ajudar com sua conta, transferências Pix, maquininha LeadsTap no celular ou API?',
      time: 'Agora'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'Como funciona o LeadsTap (celular em maquininha)?',
    'Quais são as taxas de transação?',
    'Como obter as chaves da API de desenvolvedor?',
    'Como aumentar meu limite diário de Pix?',
    'Falar com especialista humano agora'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';
      const lower = query.toLowerCase();

      if (lower.includes('celular') || lower.includes('maquininha') || lower.includes('leadstap') || lower.includes('tap')) {
        botResponse = 'O LeadsTap transforma seu smartphone em uma maquininha completa por aproximação (NFC)! Basta digitar o valor na aba LeadsTap, escolher débito ou crédito, e pedir para o cliente aproximar o cartão ou carteira digital (Apple Pay / Google Pay). O dinheiro cai na hora na sua conta LeadsPay com taxa zero no 1º mês.';
      } else if (lower.includes('taxa') || lower.includes('custo') || lower.includes('preço')) {
        botResponse = 'No LeadsPay Bank você tem Conta Digital Grátis, Pix 24/7 sem tarifas e cartão virtual gratuito. No LeadsTap por aproximação, a taxa de débito é de apenas 0.89% e crédito à vista 1.99%, sendo que novos usuários contam com taxa 0% nos primeiros 30 dias de vendas!';
      } else if (lower.includes('api') || lower.includes('desenvolvedor') || lower.includes('webhook')) {
        botResponse = 'Nossa API REST v1.4 está disponível no menu "Dev Portal". Lá você pode criar chaves de produção (lp_live_...) e de testes (lp_test_...), cadastrar Webhooks com assinatura HMAC e testar chamadas cURL, Node.js e Python diretamente no Sandbox.';
      } else if (lower.includes('limite') || lower.includes('pix')) {
        botResponse = 'Você pode personalizar seus limites diurno (06h às 20h) e noturno (20h às 06h) na Área Pix > aba Limites. A alteração é validada instantaneamente através da sua biometria facial para sua proteção.';
      } else if (lower.includes('humano') || lower.includes('especialista') || lower.includes('atendente')) {
        botResponse = 'Transferindo para nossa mesa de especialistas humanos 24/7... O agente bancário Rodrigo já conectou à sua sessão. "Olá! Em que posso ajudar você hoje?"';
      } else {
        botResponse = `Entendido perfeitamente! Sobre "${query}": sua solicitação foi registrada com prioridade na nossa central 24/7. Todas as transações no LeadsPay contam com proteção Knox Shield e suporte ininterrupto. Posso ajudar em mais algum detalhe?`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: lower.includes('humano') ? 'agent' : 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg h-[620px] bg-[#090d0a] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,230,118,0.25)] text-white flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00e676]">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00e676] rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
                <span>Suporte LeadsPay 24/7</span>
                <span className="text-[9px] bg-emerald-900/60 text-emerald-400 px-1.5 py-0.2 rounded uppercase font-semibold">
                  Online
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Atendimento bancário inteligente em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black/30">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const isAgent = m.sender === 'agent';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-1 ${
                    isAgent ? 'bg-blue-600 text-white' : 'bg-emerald-950 border border-emerald-500/40 text-[#00e676]'
                  }`}>
                    {isAgent ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#00e676] text-black font-medium rounded-tr-xs'
                      : isAgent
                        ? 'bg-blue-950/60 border border-blue-500/30 text-white rounded-tl-xs'
                        : 'bg-[#121a14] border border-white/10 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <div className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                    isUser ? 'text-black/70' : 'text-slate-400'
                  }`}>
                    <span>{m.time}</span>
                    {isUser && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl max-w-fit">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-bounce delay-300" />
              <span className="text-[10px] ml-1">Especialista digitando...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="p-2.5 bg-black/60 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-[#00e676] border border-white/5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>{q}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-black/80 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Digite sua dúvida ou mensagem..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim()}
            className="p-2.5 bg-[#00e676] hover:bg-[#00c853] disabled:opacity-30 text-black rounded-xl transition-all shadow-[0_0_12px_rgba(0,230,118,0.4)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
