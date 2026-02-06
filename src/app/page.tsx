"use client";

import { useState, useEffect } from "react";
import { TelegramProvider, useTelegram } from "@/components/providers/TelegramProvider";
import WalletConnect from "@/components/WalletConnect";
import WalletView, { Message } from "@/components/WalletView";
import DashboardHome from "@/components/DashboardHome";
import { Toaster } from "@/components/ui/toaster";
import { WalletSession } from "@/lib/wallet-sdk";

function AppContent() {
    const { webApp, user } = useTelegram();
    const [session, setSession] = useState<WalletSession | null>(null);
    const [view, setView] = useState<"dashboard" | "agent">("dashboard");

    // Generate or retrieve a persistent browser-based userId
    const getBrowserUserId = () => {
        if (typeof window === 'undefined') return `guest_${Date.now()}`;

        // Check if we have a stored userId
        let storedUserId = localStorage.getItem('wallet_user_id');

        if (!storedUserId) {
            // Generate a new unique ID for this browser
            const randomId = Math.random().toString(36).substring(2, 12);
            storedUserId = `browser_${randomId}`;
            localStorage.setItem('wallet_user_id', storedUserId);
        }

        return storedUserId;
    };

    // Derive unique userId - Priority: Telegram ID > Browser ID
    // Each browser/device will have its own unique wallet
    const userId = user?.id
        ? `tg_${user.id}`
        : getBrowserUserId();

    // Chat Persistence
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hello Traveler!",
            sender: "agent",
            type: "text",
        },
        {
            id: "2",
            text: "How can I help you today? I can move funds, bridge assets, or check yields.",
            sender: "agent",
            type: "text",
        },
    ]);

    // Check for session persistence
    useEffect(() => {
        // In a real app, you might check localStorage or a cookie here
        // But for Passkeys, usually you need to re-authenticate or keep token in memory
    }, []);

    const handleLoginSuccess = (sess: WalletSession) => {
        setSession(sess);
        setView("dashboard");
    };

    const handleLogout = () => {
        setSession(null);
        setView("dashboard");
        setMessages([]); // Clear chat on logout
    };

    if (session) {
        if (view === "agent") {
            return (
                <WalletView
                    address={session.address}
                    session={session}
                    userId={userId}
                    onLogout={handleLogout}
                    onBack={() => setView("dashboard")}
                    messages={messages}
                    setMessages={setMessages}
                />
            );
        }
        return (
            <DashboardHome
                address={session.address}
                userId={userId}
                onNavigateToAgent={() => setView("agent")}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-slate-50 dark:bg-slate-950">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Arc Smart Agent Wallet
                </p>
            </div>
            <WalletConnect onConnect={handleLoginSuccess} userId={userId} />
        </main>
    );
}

export default function Home() {
    return (
        <TelegramProvider>
            <AppContent />
            <Toaster />
        </TelegramProvider>
    );
}
