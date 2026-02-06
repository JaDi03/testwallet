
import { sendTransfer } from "@/lib/wallet-sdk";
import { ToolResult, AgentContext } from "../../types";

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_KEY || "";

export const WalletSkills = {
    /**
     * Get Address Balance (Defaults to Arc Hub)
     */
    getBalance: async (context: AgentContext, chain?: string): Promise<ToolResult> => {
        try {
            const { resolveChainKey } = await import("../cross-chain/bridgeSkill");
            const chainKey = chain ? resolveChainKey(chain) : 'arcTestnet';

            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getBalance',
                    userId: context.userId, // CRITICAL: no more 'guest' fallback
                    blockchain: chainKey
                }),
            });

            const data = await response.json();

            if (data.success && data.balance) {
                const rawUsdc = data.balance.usdc || '0';

                // Circle SDK returns human-readable amounts (e.g. "0.13")
                const usdcBalance = parseFloat(rawUsdc);

                const bal = usdcBalance.toFixed(2);
                const chainName = chainKey === 'arcTestnet' ? 'Arc Hub' : chainKey;

                return {
                    success: true,
                    message: `Your balance on ${chainName} is ${bal} USDC.`,
                    data: bal
                };
            } else {
                return { success: false, message: `Failed to fetch balance from ${chain || 'Arc Hub'}.` };
            }
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Failed to fetch balance: ${e.message}` };
        }
    },

    /**
     * Send Funds (Prioritizing Arc Native Hub)
     */
    transfer: async (to: string, amount: string, context: AgentContext, chain?: string): Promise<ToolResult> => {
        if (!to.startsWith("0x") || to.length !== 42) {
            return { success: false, message: "Invalid address format." };
        }

        try {
            const { resolveChainKey } = await import("../cross-chain/bridgeSkill");
            const { CCTP_CONFIG } = await import("../cross-chain/config");

            const chainKey = chain ? resolveChainKey(chain) : 'arcTestnet';
            const isArc = chainKey === 'arcTestnet';

            const hash = await sendTransfer(to, amount, CLIENT_URL, CLIENT_KEY, context.session, (chainKey as string) || 'arcTestnet');
            const explorer = (CCTP_CONFIG as any)[chainKey || 'arcTestnet']?.explorer || 'https://explorer-testnet.arc.circle.com';

            return {
                success: true,
                message: isArc
                    ? `Transfer successful on Arc Hub! Hash: ${hash}`
                    : `Funds sent on ${chainKey} (via Arc Extension). Hash: ${hash}`,
                data: { hash, explorer: `${explorer}/tx/${hash}` },
                action: "tx_link"
            };
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Transfer failed on Arc/Extension: ${e.message || "Unknown error"}` };
        }
    },

    /**
     * Faucet Request (Arc Specific)
     */
    requestFaucet: async (context: AgentContext): Promise<ToolResult> => {
        return {
            success: true,
            message: "To get funds for the Arc Hub, please visit the official Circle Faucet.",
            data: { url: "https://faucet.arc.circle.com", address: context.userAddress },
            action: "faucet_card"
        };
    }
};
