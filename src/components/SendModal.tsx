
"use client";

import React, { useState } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: string;
    userId: string;
    onSuccess?: () => void;
}

export default function SendModal({ isOpen, onClose, balance, userId, onSuccess }: SendModalProps) {
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [txHash, setTxHash] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSend = async () => {
        if (!address || !amount) return;
        setIsLoading(true);
        setStatus("loading");

        try {
            // Get internal wallet first (using dynamic userId)
            const walletResp = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: 'arcTestnet' }),
            });
            const { walletId } = await walletResp.json();

            // Execute Transaction
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'executeTransaction',
                    walletId,
                    toAddress: address,
                    // Parse amount to 6 decimals for USDC
                    amount: (parseFloat(amount) * 1e6).toFixed(0),
                    tokenAddress: '0x3600000000000000000000000000000000000000', // Correct Arc USDC address
                    blockchain: 'ARC-TESTNET'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus("success");
                setTxHash(data.txHash || "");
                if (onSuccess) onSuccess();
            } else {
                throw new Error(data.error || "Transaction failed");
            }
        } catch (error: any) {
            console.error("Manual Transfer Error:", error);
            setStatus("error");
            setErrorMsg(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="w-full max-w-md bg-white dark:bg-[#1c1c1e] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Send USDC</h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {status === "idle" || status === "loading" ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2 block">Recipient Address</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors font-mono"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest block">Amount</label>
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Balance: {balance} USDC</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white text-2xl font-black outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 dark:text-gray-500">USDC</span>
                                            <button
                                                onClick={() => setAmount(balance)}
                                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-md hover:bg-blue-500/20 transition-colors"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={isLoading || !address || !amount}
                                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : status === "success" ? (
                            <div className="py-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4 animate-bounce">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Transaction Sent!</h3>
                                <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Your tokens are on their way.</p>

                                {txHash && (
                                    <a
                                        href={`https://testnet.arcscan.app/tx/${txHash}`}
                                        target="_blank"
                                        className="text-blue-600 dark:text-blue-400 text-xs font-mono break-all mb-8 block hover:underline"
                                    >
                                        View: {txHash.slice(0, 20)}...
                                    </a>
                                )}

                                <Button onClick={onClose} className="w-full bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-slate-900 dark:text-white rounded-2xl h-12">
                                    Done
                                </Button>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Transfer Failed</h3>
                                <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">{errorMsg}</p>

                                <Button onClick={() => setStatus("idle")} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-12">
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
