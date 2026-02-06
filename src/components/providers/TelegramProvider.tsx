"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
}

interface TelegramContextType {
    webApp: any;
    user: TelegramUser | null;
    isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    isReady: false,
});

export const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
    const [webApp, setWebApp] = useState<any | null>(null);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            tg.ready();
            setWebApp(tg);
            setUser(tg.initDataUnsafe?.user || null);
            setIsReady(true);
        }
    }, []);

    return (
        <TelegramContext.Provider value={{ webApp, user, isReady }}>
            {children}
        </TelegramContext.Provider>
    );
};

export const useTelegram = () => useContext(TelegramContext);
