import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  X,
  ChevronDown,
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Radio,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import { InspectionRecord } from '../../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeInspection?: InspectionRecord | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeInspection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('labelLens_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content:
          '👋 Hello Inspector! I am your **Legal Metrology & FSSAI Packaging Compliance Assistant** powered by Gemini.\n\nAsk me about:\n- **PCR 2011 Rules & Mandated Declarations** (Rules 6, 9, 18)\n- **Unit Sale Price (USP) & MRP rules**\n- **Font Height & Principal Display Area (PDA) schedules**\n- **Net Quantity Maximum Permissible Error (MPE)**\n- **Penalty calculations under Section 36/49**\n- Or attach your active inspection for an instant compliance audit!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [includeContext, setIncludeContext] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');

  // Voice Mode State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(12).fill(10));
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save chat to localStorage
  useEffect(() => {
    localStorage.setItem('labelLens_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio wave animation when listening or speaking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioLevel(
          new Array(14).fill(0).map(() => Math.floor(Math.random() * 45) + 8)
        );
      }, 100);
    } else {
      setAudioLevel(new Array(14).fill(8));
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  // Web Speech Recognition setup for live voice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          if (event.results[0].isFinal) {
            handleSendVoiceMessage(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedModel, includeContext, activeInspection]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition start failed', err);
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown syntax for speech
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
          model: selectedModel,
          contextData: includeContext && activeInspection ? {
            productName: activeInspection.productName,
            status: activeInspection.status,
            extractedFields: activeInspection.extractedFields,
            findings: activeInspection.findings,
            remarks: activeInspection.remarks,
          } : undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `ast_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed || selectedModel,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to receive response');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Query Error**: ${err.message || 'Unable to connect to Gemini service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim()) return;
    await handleSendMessage(voiceText);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history?')) {
      const initial: ChatMessage[] = [
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: 'Conversation history cleared. Ready for your compliance inquiries!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ];
      setMessages(initial);
      localStorage.removeItem('labelLens_chat_history');
    }
  };

  const quickPrompts = [
    { label: 'Audit Active Inspection', text: 'Please review all mandatory fields and compliance violations in the active inspection, and generate a step-by-step remediation plan.' },
    { label: 'PCR Rule 6 Checklist', text: 'List all mandatory declarations required under Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011 with minimum font sizes.' },
    { label: 'Unit Sale Price (USP) Rules', text: 'Explain the Unit Sale Price (USP) declaration requirement under PCR 2011 for packages over 1kg/1L vs under 1kg/1L.' },
    { label: 'Section 36 Penalty Slabs', text: 'What are the legal penalties, compounding options, and fine amounts under Section 36 of the Legal Metrology Act 2009 for non-standard packaging?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F0B1E] border border-violet-700/50 rounded-2xl w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#17112E] border-b border-violet-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">AI Compliance Assistant</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Senior Legal Metrology (PCR 2011) & FSSAI Standards Officer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-[#0B0817] border border-violet-700/60 rounded-lg px-2.5 py-1.5 text-xs text-violet-300 font-mono focus:outline-none focus:border-violet-400 cursor-pointer"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (General)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex)</option>
              </select>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center bg-[#0B0817] p-1 rounded-lg border border-violet-800/40">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'voice'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-fuchsia-300" />
                Live Voice
              </button>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="p-1.5 rounded-lg bg-[#0B0817] border border-violet-800/40 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#0B0817] border border-violet-800/40 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Inspection Context Bar */}
        {activeInspection && (
          <div className="px-6 py-2 bg-[#120D24] border-b border-violet-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span className="text-slate-300 font-medium">Active Inspection:</span>
              <span className="text-violet-200 font-bold">{activeInspection.productName || 'Unnamed Sample'}</span>
              <span className="text-slate-500 font-mono">({activeInspection.id})</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="rounded border-violet-700 text-violet-600 focus:ring-violet-500 bg-[#0B0817]"
              />
              <span className="text-slate-400 text-[11px]">Include sample context in prompt</span>
            </label>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gradient-to-tr from-purple-700 to-violet-500 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-none shadow-md'
                          : 'bg-[#191333] border border-violet-800/40 text-slate-200 rounded-tl-none shadow-md'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 px-1 font-mono">
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && <span>• {msg.modelUsed}</span>}
                      {msg.role === 'assistant' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSpeakText(msg.content)}
                            className="text-slate-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            Speak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="text-slate-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            {isCopied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {isCopied === msg.id ? 'Copied' : 'Copy'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#191333] border border-violet-800/40 text-slate-300 rounded-tl-none flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-violet-300 font-mono ml-1">Analyzing regulations & formulating response...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-6 py-2 bg-[#120D24] border-t border-violet-900/40 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-violet-400 flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3" /> Quick Prompts:
              </span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp.text)}
                  className="px-2.5 py-1 rounded-full bg-[#1A1435] hover:bg-violet-900/50 border border-violet-700/40 text-[11px] text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[#17112E] border-t border-violet-800/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ask about Legal Metrology PCR 2011, FSSAI regulations, or active sample..."
                    disabled={isLoading}
                    className="w-full bg-[#0B0817] border border-violet-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-slate-400 hover:text-violet-300'
                    }`}
                    title={isListening ? 'Stop Listening' : 'Speak Prompt'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Live Voice Conversation Mode */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#140F2A] to-[#0A0714] text-center space-y-6">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <div
                className={`absolute w-44 h-44 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-fuchsia-500/20 animate-ping'
                    : isSpeaking
                    ? 'bg-violet-500/20 animate-pulse'
                    : 'bg-violet-900/10'
                }`}
              />

              {/* Main mic button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white ring-8 ring-rose-500/30'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white ring-8 ring-violet-500/30'
                    : 'bg-[#1F183C] hover:bg-[#2A2050] text-violet-300 border-2 border-violet-600/50'
                }`}
              >
                {isListening ? (
                  <Mic className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            {/* Audio Waveform Indicator */}
            <div className="flex items-center gap-1.5 h-12">
              {audioLevel.map((lvl, idx) => (
                <div
                  key={idx}
                  style={{ height: `${lvl}px` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isListening
                      ? 'bg-rose-400'
                      : isSpeaking
                      ? 'bg-violet-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Status Label */}
            <div className="space-y-2 max-w-md">
              <h4 className="text-lg font-bold text-white">
                {isListening
                  ? 'Listening to Inspector...'
                  : isSpeaking
                  ? 'Gemini Live is Speaking...'
                  : 'Tap Microphone to Speak'}
              </h4>
              <p className="text-xs text-slate-400">
                {transcript
                  ? `"${transcript}"`
                  : 'Speak naturally to audit compliance, ask rule questions, or inquire about mandatory package declarations.'}
              </p>
            </div>

            {/* Model & Latency badge */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-[#120D24] px-4 py-2 rounded-xl border border-violet-800/40">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Engine: gemini-3.8-live</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Real-Time Voice Streaming</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
