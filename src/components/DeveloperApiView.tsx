import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Code2, 
  Key, 
  Webhook, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Server
} from 'lucide-react';
import { DeveloperApiKey, WebhookConfig } from '../types';
import { apiEndpointsDoc } from '../data/mockData';

interface DeveloperApiViewProps {
  apiKeys: DeveloperApiKey[];
  webhooks: WebhookConfig[];
  onGenerateKey: (name: string, env: 'production' | 'sandbox') => void;
  onAddWebhook: (url: string, events: string[]) => void;
}

export const DeveloperApiView: React.FC<DeveloperApiViewProps> = ({
  apiKeys,
  webhooks,
  onGenerateKey,
  onAddWebhook
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs' | 'tester'>('keys');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);
  const [webhookSimStatus, setWebhookSimStatus] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'node' | 'python'>('node');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunApiTest = () => {
    setIsExecutingTest(true);
    setTestResponse(null);
    setTimeout(() => {
      setTestResponse(apiEndpointsDoc[selectedEndpointIndex].responseSample);
      setIsExecutingTest(false);
    }, 450);
  };

  const handleSimulateWebhook = () => {
    setWebhookSimStatus('sending');
    setTimeout(() => {
      setWebhookSimStatus('success');
      setTimeout(() => setWebhookSimStatus(null), 3000);
    }, 800);
  };

  const currentEndpoint = apiEndpointsDoc[selectedEndpointIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <span>LeadsPay Developers</span>
            <span className="text-xs bg-[#00e676]/20 text-[#00e676] px-2 py-0.5 rounded-full font-mono">
              API v1.4 REST
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Integração financeira para e-commerces, gateways e desenvolvedores parceiros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            API Gateway Operante · 99.99% Uptime
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'keys', label: 'Chaves de API', icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          { id: 'docs', label: 'API Explorer & Docs', icon: Code2 },
          { id: 'tester', label: 'Sandbox Tester', icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Chaves de autenticação (Bearer Token)</span>
            <button
              onClick={() => {
                const name = prompt('Nome da aplicação/chave:', 'Nova Integração ERP');
                if (name) onGenerateKey(name, 'production');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-black text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Nova Chave</span>
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      k.environment === 'production'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {k.environment}
                    </span>
                    <h4 className="text-xs font-semibold text-white">{k.name}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Criado em {k.createdAt}</span>
                </div>

                {/* Key value box with copy button */}
                <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-xl border border-white/5 font-mono text-xs">
                  <span className="text-slate-300 truncate max-w-[280px] sm:max-w-md">
                    {k.fullKey || k.keyPrefix}
                  </span>
                  <button
                    onClick={() => handleCopy(k.id, k.fullKey || k.keyPrefix)}
                    className="p-1.5 text-slate-400 hover:text-[#00e676] transition-colors flex items-center gap-1"
                  >
                    {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedId === k.id ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Última chamada: <strong className="text-slate-200">{k.lastUsed}</strong></span>
                  <span className="text-emerald-400">Ativa · Acesso total à API</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Disparo de eventos HTTP automáticos</span>
            <button
              onClick={() => {
                const url = prompt('URL de destino do Webhook (https):', 'https://');
                if (url && url.startsWith('http')) {
                  onAddWebhook(url, ['pix.received', 'tap.payment_approved']);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-black text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Webhook</span>
            </button>
          </div>

          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
                  <span className="text-xs font-mono text-white truncate max-w-[260px] sm:max-w-md">{wh.url}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  HTTP 200 OK
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Eventos Inscritos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {wh.events.map((ev, i) => (
                    <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400 text-[11px]">Segredo: <code className="text-slate-300">{wh.secret}</code></span>
                <button
                  onClick={handleSimulateWebhook}
                  disabled={webhookSimStatus === 'sending'}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[#00e676] rounded-lg text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${webhookSimStatus === 'sending' ? 'animate-spin' : ''}`} />
                  <span>{webhookSimStatus === 'success' ? 'Disparado (200 OK)!' : 'Simular Disparo'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3 & 4: API EXPLORER & SANDBOX TESTER */}
      {(activeTab === 'docs' || activeTab === 'tester') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Endpoint list column */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs text-slate-400 block mb-1">Endpoints Disponíveis</span>
            {apiEndpointsDoc.map((ep, i) => (
              <button
                key={i}
                onClick={() => setSelectedEndpointIndex(i)}
                className={`w-full p-3 rounded-2xl text-left border transition-all ${
                  selectedEndpointIndex === i
                    ? 'bg-[#00e676]/10 border-[#00e676]/40 text-white'
                    : 'bg-black/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    ep.method === 'POST' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-blue-950 text-blue-400 border border-blue-500/30'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-slate-200">{ep.path}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{ep.title}</p>
              </button>
            ))}
          </div>

          {/* Endpoint Details and Interactive Runner */}
          <div className="lg:col-span-8 bg-black/60 border border-white/10 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#00e676] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {currentEndpoint.method}
                  </span>
                  <span className="font-mono text-sm text-white font-semibold">{currentEndpoint.path}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">{currentEndpoint.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentEndpoint.description}</p>
              </div>

              {/* Language toggle */}
              <div className="flex items-center p-1 bg-black/50 border border-white/10 rounded-xl text-xs self-start sm:self-auto">
                {(['node', 'curl', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg uppercase font-mono text-[10px] font-semibold transition-all ${
                      codeLanguage === lang ? 'bg-[#00e676]/20 text-[#00e676]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet */}
            <div className="bg-[#0b0e0c] border border-white/10 rounded-2xl p-3 font-mono text-xs text-slate-300 overflow-x-auto relative">
              <button
                onClick={() => handleCopy('snippet', 'curl -X POST https://api.leadspay.com.br/v1/pix/charges')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Copiar código"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <pre className="text-[11px] leading-relaxed">
                {codeLanguage === 'node' && `import { LeadsPayClient } from '@leadspay/sdk';

const client = new LeadsPayClient({ apiKey: 'lp_live_...' });
const response = await client.${currentEndpoint.path.includes('pix') ? 'pix.createCharge' : currentEndpoint.path.includes('tap') ? 'tap.authorizePayment' : 'account.getBalance'}(${currentEndpoint.bodySample ? JSON.stringify(currentEndpoint.bodySample, null, 2) : ''});
console.log(response);`}
                {codeLanguage === 'curl' && `curl -X ${currentEndpoint.method} "https://api.leadspay.com.br${currentEndpoint.path}" \\
  -H "Authorization: Bearer lp_live_..." \\
  -H "Content-Type: application/json" ${currentEndpoint.bodySample ? `\\
  -d '${JSON.stringify(currentEndpoint.bodySample)}'` : ''}`}
                {codeLanguage === 'python' && `import requests

headers = { "Authorization": "Bearer lp_live_...", "Content-Type": "application/json" }
response = requests.${currentEndpoint.method.toLowerCase()}("https://api.leadspay.com.br${currentEndpoint.path}", json=${JSON.stringify(currentEndpoint.bodySample)}, headers=headers)
print(response.json())`}
              </pre>
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleRunApiTest}
                disabled={isExecutingTest}
                className="px-4 py-2.5 bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,230,118,0.3)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{isExecutingTest ? 'Enviando...' : 'Executar no Sandbox'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">Response: JSON / Application</span>
            </div>

            {/* Live Response Viewer */}
            {testResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-emerald-400 font-semibold">Status: 200 OK (38ms)</span>
                  <span className="text-[10px]">Dados gerados em tempo real</span>
                </div>
                <div className="bg-[#070a08] border border-emerald-500/30 rounded-2xl p-3 font-mono text-[11px] text-emerald-300 max-h-52 overflow-y-auto">
                  <pre>{JSON.stringify(testResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
