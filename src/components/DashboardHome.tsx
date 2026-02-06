"use client";

import React, { useState, useEffect } from "react";
import { useTelegram } from "@/components/providers/TelegramProvider";
import {
    Loader2, Send, ArrowDownLeft, RefreshCw, Wallet,
    Scan, Plus, ArrowUpRight, ArrowRightLeft,
    ChevronDown, TrendingUp, History, Coins,
    Settings, ShieldCheck, Sparkles, MessageSquare
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from "@/components/ui/button";
import SendModal from "./SendModal";
import ReceiveModal from "./ReceiveModal";

// -- Mock Data for Chart --
const CHART_DATA = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
];

interface DashboardHomeProps {
    address: string;
    userId: string;
    onNavigateToAgent: () => void;
    onLogout: () => void;
}

export default function DashboardHome({ address, userId, onNavigateToAgent, onLogout }: DashboardHomeProps) {
    const { user } = useTelegram();
    const [balance, setBalance] = useState<string>("0.00");
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

    // Real Balance Fetch from Autonomous Wallet
    const fetchBalance = async () => {
        setLoading(true);
        try {
            // Use the server wallet API for autonomous wallet balance
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

                // Circle SDK returns human-readable amounts (e.g., "0.13" or "20")
                // No need to divide by decimals.
                const usdcBalance = parseFloat(rawUsdc);
                setBalance(usdcBalance.toFixed(2));
            } else {
                setBalance("0.00");
            }
        } catch (error) {
            console.error("Balance fetch error:", error);
            setBalance("0.00");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [address]);

    return (
        <div className="flex flex-col min-h-screen bg-[#1c1c1e] text-white font-sans overflow-hidden">
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

            {/* --- Top Header --- */}
            {/* ... rest of header ... */}
            <header className="px-4 py-3 flex items-center justify-between sticky top-0 bg-[#1c1c1e] z-20 shadow-md shadow-black/20">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700 ring-2 ring-indigo-500/50 flex items-center justify-center">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">{user?.first_name?.[0] || 'U'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold tracking-wide">Arc Wallet</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                        </div>
                        <span className="text-[10px] text-indigo-400 font-mono">
                            {address.slice(0, 6)}...{address.slice(-4)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#2c2c2e] rounded-full px-1 p-0.5 border border-white/5">
                        <span className="px-3 py-1 text-xs font-medium text-gray-400">Network</span>
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-white shadow-sm flex items-center gap-1">
                            ARC
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                {/* --- Chart Area --- */}
                <div className="mt-2 h-48 w-full relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1e] via-transparent to-[#1c1c1e] z-10 pointer-events-none"></div>
                    <div className="w-full h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip cursor={false} contentStyle={{ backgroundColor: '#2c2c2e', borderRadius: '12px', borderColor: '#3a3a3c' }} itemStyle={{ color: '#fff' }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">Total Balance</span>
                        <div className="flex items-center gap-2">
                            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                                ${balance}
                            </h2>
                            <button onClick={fetchBalance} className="pointer-events-auto p-1 bg-white/5 rounded-full hover:bg-white/10">
                                <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <span className="text-indigo-400 text-xs font-medium bg-indigo-400/10 px-2 py-0.5 rounded mt-1 flex items-center gap-1">
                            USDC (Arc)
                        </span>
                    </div>
                </div>

                {/* --- Quick Actions --- */}
                <div className="grid grid-cols-4 gap-4 px-6 mt-6">
                    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsSendOpen(true)}>
                        <div className={`w-14 h-14 rounded-2xl bg-[#2c2c2e] flex items-center justify-center group-hover:bg-[#3a3a3c] active:scale-95 transition-all shadow-lg shadow-black/20 border border-white/5`}>
                            <Send className={`w-6 h-6 text-indigo-400`} />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-400 transition-colors tracking-tight">Transfer</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsReceiveOpen(true)}>
                        <div className={`w-14 h-14 rounded-2xl bg-[#2c2c2e] flex items-center justify-center group-hover:bg-[#3a3a3c] active:scale-95 transition-all shadow-lg shadow-black/20 border border-white/5`}>
                            <Plus className={`w-6 h-6 text-indigo-400`} />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-400 transition-colors tracking-tight">Top Up</span>
                    </div>

                    {[
                        { icon: ArrowUpRight, label: 'Withdraw' },
                        { icon: ArrowRightLeft, label: 'Swap' },
                    ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onNavigateToAgent}>
                            <div className={`w-14 h-14 rounded-2xl bg-[#2c2c2e] flex items-center justify-center group-hover:bg-[#3a3a3c] active:scale-95 transition-all shadow-lg shadow-black/20 border border-white/5`}>
                                <action.icon className={`w-6 h-6 text-indigo-400`} />
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-400 transition-colors tracking-tight">{action.label}</span>
                        </div>
                    ))}
                </div>

                {/* --- AGENT CTA --- */}
                <div className="px-6 mt-8">
                    <Button
                        onClick={onNavigateToAgent}
                        className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-between px-6 transition-all active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-bold text-white">Ask your Agent</span>
                                <span className="text-[10px] text-indigo-100">Transfers, Bridges, Yield & more</span>
                            </div>
                        </div>
                        <ArrowRightLeft className="w-5 h-5 text-indigo-200" />
                    </Button>
                </div>

                {/* --- Asset List --- */}
                <div className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <span className="text-sm font-bold text-white">Your Assets</span>
                        <Settings className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-2">
                        <div className="px-4 py-3 bg-[#2c2c2e]/50 rounded-xl flex items-center justify-between hover:bg-[#2c2c2e] transition-colors border border-white/5 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-blue-500 shadow-md`}>
                                    U
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">USDC</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <span>USDC</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold text-white text-sm">{balance}</h3>
                                <p className="text-xs text-gray-500">Arc Testnet</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="flex justify-center pb-8 pt-4">
                <button onClick={onLogout} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Log Out</button>
            </div>
        </div>
    );
}
