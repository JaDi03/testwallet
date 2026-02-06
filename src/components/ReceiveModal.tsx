"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
}

export default function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="w-full max-w-md bg-[#1c1c1e] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-500/10"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-white">Receive Funds</h2>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transtion-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl p-8 mb-8 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group">
                            {/* Simulated QR Code with CSS and Lucide */}
                            <div className="relative z-10 p-4 bg-white rounded-2xl border-4 border-slate-100 flex items-center justify-center">
                                <QrCode size={180} className="text-slate-900" />
                            </div>
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Your Arc (SCA) Address</label>
                                <div className="bg-[#2c2c2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 group">
                                    <span className="text-indigo-400 font-mono text-sm break-all flex-1">
                                        {address}
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-indigo-500 transition-all flex-shrink-0"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={`https://testnet.arcscan.app/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 text-xs font-bold transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    Explorer
                                </a>
                                <Button className="h-12 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 text-xs font-bold transition-colors flex items-center gap-2 border-none">
                                    <Download size={14} />
                                    Save image
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center px-4">
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                Only send <span className="text-indigo-400 font-bold uppercase tracking-tight">USDC</span> or <span className="text-indigo-400 font-bold uppercase tracking-tight">Native Assets</span> on the <span className="text-white font-bold">Arc Testnet</span> to this address. Sending other tokens may result in permanent loss.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
