
import { sendTransfer } from "@/lib/wallet-sdk";
import { ToolResult, AgentContext } from "../../types";

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_KEY || "";

export const WalletSkills = {
    /**
     * Get Address Balance (Defaults to Arc Hub)
     */
    getBalance: async (context: AgentContext, chain?: string, tokenSymbol?: string): Promise<ToolResult> => {
        try {
            console.log(`[DEBUG] WalletSkills.getBalance called for userId: ${context.userId}, chain: ${chain}, token: ${tokenSymbol}`);
            const { resolveChainKey } = await import("../cross-chain/bridgeSkill");

            const targetChains = chain
                ? [resolveChainKey(chain)]
                : ['arcTestnet', 'ethereumSepolia', 'baseSepolia'];

            const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
            const url = `${baseUrl}/api/wallet`;

            console.log(`[DEBUG] Fetching balances from: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getAllBalances',
                    userId: context.userId,
                    chains: targetChains,
                    tokenSymbol: tokenSymbol
                }),
            });

            console.log(`[DEBUG] API Response Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[DEBUG] API Error Body: ${errorText}`);
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log(`[DEBUG] API Data received:`, JSON.stringify(data));

            const tokenBalances = data.balances || [];

            if (tokenBalances.length === 0) {
                return {
                    success: true,
                    message: chain
                        ? `You don't have any supported tokens on ${chain}.`
                        : "Your wallet is currently empty across all supported chains (Arc, Base, Sepolia)."
                };
            }

            if (!chain) {
                // Multi-chain Portfolio Check
                const report = tokenBalances.map((t: any) => `- ${t.balance} ${t.symbol} on ${t.chain}`).join('\n');
                return {
                    success: true,
                    message: `Here is your current portfolio:\n${report}`,
                    data: tokenBalances
                };
            }

            // Specific Chain Check
            const report = tokenBalances.map((t: any) => `${t.balance} ${t.symbol}`).join(', ');
            return {
                success: true,
                message: `Your balance on ${chain} is: ${report}.`,
                data: tokenBalances
            };
        } catch (e: any) {
            console.error(`[DEBUG] createWallet/getBalance Failed:`, e);
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

            const chainKey = (chain ? resolveChainKey(chain) : 'arcTestnet') || 'arcTestnet';

            console.log(`[WalletSkills] Executing Transfer: ${amount} USDC -> ${to} on ${chainKey}`);

            // SERVER-SIDE EXECUTION (No session needed, uses Developer Wallet)
            try {
                // 1. Get Wallet
                const { getOrCreateWallet, executeTransaction } = await import("@/lib/serverWallet");
                const wallet = await getOrCreateWallet(context.userId || '', chainKey || 'arcTestnet');

                // 2. Get USDC Address (if not native Arc)
                let tokenAddress: string | undefined;
                if (chainKey !== 'arcTestnet') {
                    const usdcAddresses: Record<string, string> = {
                        'ethereumSepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                        'baseSepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
                    };
                    tokenAddress = usdcAddresses[chainKey];
                }

                // 3. Execute
                const resultId = await executeTransaction(wallet.walletId, to, amount, tokenAddress, chainKey);

                const explorer = (CCTP_CONFIG as any)[chainKey]?.explorer || 'https://explorer-testnet.arc.circle.com';
                const isHash = resultId.startsWith('0x');
                const label = isHash ? 'Hash' : 'Request ID (Pending)';
                const explorerLink = isHash ? `${explorer}/tx/${resultId}` : undefined;

                return {
                    success: true,
                    message: `✅ Transfer Sent! ${label}: ${resultId}`,
                    data: {
                        hash: resultId,
                        explorer: explorerLink,
                        isPending: !isHash
                    },
                    action: "tx_link"
                };

            } catch (serverError: any) {
                console.error("Server Transfer Failed:", serverError);
                throw serverError; // Let catch block below handle it
            }

        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Transfer failed on Arc/Extension: ${e.message || "Unknown error"}` };
        }
    },

    /**
     * Faucet Request (Arc Specific)
     */
    requestFaucet: async (context: AgentContext, chain?: string): Promise<ToolResult> => {
        const targetChain = chain || 'arcTestnet';
        console.log(`[WalletSkills] Requesting Faucet for ${context.userId} on ${targetChain} (Address: ${context.userAddress})`);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'faucet',
                    userId: context.userId,
                    blockchain: targetChain,
                    address: context.userAddress
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    message: `✅ Faucet Request Successful! Sent testnet tokens to your wallet on ${targetChain}.\nCheck your balance in a few seconds.`,
                    data: data
                };
            } else {
                throw new Error(data.error || 'Unknown error');
            }

        } catch (e: any) {
            console.error(`[WalletSkills] Faucet failed:`, e);

            // Handle clean rate limit message if it comes from our API
            if (e.message?.includes("⏳ Faucet Cooldown")) {
                return {
                    success: false,
                    message: e.message, // Return the clean message directly
                    action: "faucet_card"
                };
            }

            return {
                success: false, // Return false so the agent knows it failed
                message: `⚠️ Auto-Faucet failed: ${e.message}.\n\nYou can try manually at the official faucet:`,
                data: { url: "https://faucet.circle.com", address: context.userAddress },
                action: "faucet_card"
            };
        }
    }
};
