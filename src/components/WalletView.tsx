"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Wallet, RefreshCw, Zap, ArrowRightLeft, Droplets } from "lucide-react";
import { useTelegram } from "@/components/providers/TelegramProvider";
import { motion, AnimatePresence } from "framer-motion";
import { sendTransfer } from "@/lib/wallet-sdk";
import { useToast } from "@/hooks/use-toast";
import { processUserIntent } from "@/agent/engine";

export interface Message {
    id: string;
    text: string;
    sender: "user" | "agent";
    type: "text" | "action_card";
}

interface WalletViewProps {
    address: string;
    session: any; // Using any for simplicity here to avoid circular dep issues or complex imports
    userId: string;
    onLogout: () => void;
    onBack: () => void;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// Helper to render text with links
const LinkRenderer = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <span>
            {parts.map((part, i) =>
                urlRegex.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">
                        {part}
                    </a>
                ) : (
                    part
                )
            )}
        </span>
    );
};

import SendModal from "./SendModal";
import ReceiveModal from "./ReceiveModal";

export default function WalletView({ address, session, userId, onLogout, onBack, messages, setMessages }: WalletViewProps) {
    const { user, webApp } = useTelegram();
    const [balance, setBalance] = useState<string>("0.00");
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const { toast } = useToast();

    // Modal States
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

    // Chat State
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (webApp) webApp.expand();
        webApp?.BackButton?.show();
        webApp?.BackButton?.onClick(onBack);

        return () => {
            webApp?.BackButton?.hide();
            webApp?.BackButton?.offClick(onBack);
        }
    }, [webApp, onBack]);

    // Real Balance Fetch from Autonomous Wallet
    const fetchBalance = async () => {
        setIsLoadingBalance(true);
        try {
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getBalance',
                    userId: userId,
                    blockchain: 'arcTestnet'
                }),
            });

            const data = await response.json();

            if (data.success && data.balance) {
                const rawUsdc = data.balance.usdc || '0';
                const decimals = data.balance.usdcDecimals || 18;
                let usdcBalance = parseFloat(rawUsdc);
                if (usdcBalance > 1000000 || rawUsdc.length > 10) {
                    usdcBalance = usdcBalance / Math.pow(10, decimals);
                }
                setBalance(usdcBalance.toFixed(2));
            } else {
                setBalance("0.00");
            }
        } catch (error) {
            console.error("Balance fetch error:", error);
            setBalance("0.00");
        } finally {
            setIsLoadingBalance(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [address]);

    const handleSend = async (manualText?: string) => {
        const textToSend = manualText || input;
        if (!textToSend.trim()) return;

        // 1. User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: "user",
            type: "text",
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // 2. Agent Logic
        try {
            const response = await processUserIntent(textToSend, address, session, messages, userId);

            setIsTyping(false);

            // Main Agent Response
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: "agent",
                type: "text"
            }]);

        } catch (error) {
            console.error(error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "I encountered an error processing that request.",
                sender: "agent",
                type: "text"
            }]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Modals */}
            <SendModal
                isOpen={isSendOpen}
                onClose={() => setIsSendOpen(false)}
                balance={balance}
                userId={userId}
                onSuccess={fetchBalance}
            />
            <ReceiveModal
                isOpen={isReceiveOpen}
                onClose={() => setIsReceiveOpen(false)}
                address={address}
            />

            {/* --- Simple Chat Header --- */}
            <div className="bg-slate-900 text-white p-4 py-3 shadow-md z-10 flex items-center gap-3">
                <button onClick={onBack} className="md:hidden p-1 -ml-1">
                    {/* Fallback back button if Telegram BackButton fails */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex-1">
                    <h3 className="font-bold text-sm">Arc Agent</h3>
                    <p className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        Online • ${balance} USDC
                    </p>
                </div>

                {/* Manual Actions in Header */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSendOpen(true)}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-indigo-400"
                        title="Send"
                    >
                        <Send size={16} />
                    </button>
                    <button
                        onClick={() => setIsReceiveOpen(true)}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-indigo-400"
                        title="Receive"
                    >
                        <Droplets size={16} />
                    </button>
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 scroll-smooth bg-slate-50 dark:bg-slate-950">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center border border-slate-100 dark:border-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT AREA --- */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 pb-6 backdrop-blur-md sticky bottom-0 z-20">
                <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 hover:border-indigo-300 transition-colors shadow-inner">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a command..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 font-medium"
                        enterKeyHint="send"
                    />
                    <button
                        onClick={() => handleSend()}
                        className={`ml-2 p-2 rounded-full transition-all duration-200 ${input.trim()
                            ? "bg-indigo-600 text-white scale-100 shadow-lg shadow-indigo-500/30"
                            : "bg-slate-200 text-slate-400 scale-90"
                            }`}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="flex justify-center mt-2">
                    <button onClick={onLogout} className="text-[10px] text-slate-400 hover:text-red-400 transition-colors uppercase font-bold tracking-widest">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
}: {
    icon: any;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 group"
        >
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 group-hover:bg-slate-700 group-hover:text-white transition-all shadow-lg group-hover:shadow-indigo-500/20 active:scale-95">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-slate-200 transition-colors">
                {label}
            </span>
        </button>
    );
}
