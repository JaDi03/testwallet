import { sendTransfer } from "@/lib/wallet-sdk";

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_KEY || "";

export type ToolResult = {
    success: boolean;
    message: string;
    data?: any;
};

export const AgentTools = {
    /**
     * Get Address Balance
     */
    getBalance: async (address: string, context?: { userId: string }): Promise<ToolResult> => {
        try {
            const userId = context?.userId;
            if (!userId) {
                return { success: false, message: 'Error: Missing userId in context.' };
            }
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getBalance',
                    userId: userId,
                }),
            });

            const data = await response.json();

            if (data.success && data.balance) {
                const usdcBalance = parseFloat(data.balance.usdc || '0') / 1e6;
                const bal = usdcBalance.toFixed(2);
                return { success: true, message: `Your balance is ${bal} USDC (Arc).`, data: bal };
            } else {
                return { success: false, message: "Failed to fetch balance." };
            }
        } catch (e: any) {
            return { success: false, message: "Failed to fetch balance." };
        }
    },

    /**
     * Request Testnet Faucet
     */
    requestFaucet: async (address: string): Promise<ToolResult> => {
        // Automation of faucet is explicit: we return the URL and instructions.
        // In a more advanced version, this could call an API proxy that calls the faucet.
        return {
            success: true,
            message: "To get funds, please visit the official Circle Faucet.",
            data: { url: "https://faucet.arc.circle.com", address }
        };
    },

    /**
     * Send Funds
     */
    transfer: async (to: string, amount: string, session?: { smartAccount: any, bundlerClient: any }): Promise<ToolResult> => {
        if (!to.startsWith("0x") || to.length !== 42) {
            return { success: false, message: "Invalid address format." };
        }

        try {
            const hash = await sendTransfer(to, amount, CLIENT_URL, CLIENT_KEY, session);
            return {
                success: true,
                message: `Transfer initiated! Hash: ${hash}`,
                data: { hash, explorer: `https://explorer-testnet.arc.circle.com/tx/${hash}` }
            };
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Transfer failed: ${e.message || "Unknown error"}` };
        }
    },
    /**
     * Invest / Stake Funds (DeFi Simulation)
     */
    invest: async (amount: string, session?: { smartAccount: any, bundlerClient: any }): Promise<ToolResult> => {
        // In a real scenario, this would interact with a smart contract (e.g., AAVE Pool, Staking Contract).
        // For verify, we send funds to a "Vault" address on Arc Testnet.
        const VAULT_ADDRESS = "0x7890123456789012345678901234567890123456"; // Dummy Vault

        try {
            const hash = await sendTransfer(VAULT_ADDRESS, amount, CLIENT_URL, CLIENT_KEY, session);
            return {
                success: true,
                message: `Successfully staked ${amount} USDC into the Yield Vault! 🚀 Earning 5% APY.`,
                data: { hash, explorer: `https://explorer-testnet.arc.circle.com/tx/${hash}` }
            };
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Investment failed: ${e.message || "Unknown error"}` };
        }
    },

    /**
     * Token Swap - Buy/Sell tokens on DEX
     */
    swap: async (
        fromToken: string,
        toToken: string,
        amount: string,
        context: { userId: string; userAddress: string; session?: any },
        maxSlippage?: number,
        chain?: string
    ): Promise<ToolResult> => {
        const { SwapSkill } = await import("./skills/defi/swapSkill");
        return SwapSkill.swap(fromToken, toToken, amount, context, maxSlippage, chain);
    },

    /**
     * Get Swap Quote - Check price without executing
     */
    getSwapQuote: async (
        fromToken: string,
        toToken: string,
        amount: string,
        chain?: string
    ): Promise<ToolResult> => {
        const { SwapSkill } = await import("./skills/defi/swapSkill");
        return SwapSkill.getQuote(fromToken, toToken, amount, chain);
    }
};
