import { sendTransfer } from "@/lib/wallet-sdk";
import { ToolResult, AgentContext } from "../../types";

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || "";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_KEY || "";

export const InvestSkill = {
    /**
     * Invest / Stake Funds (DeFi Simulation)
     */
    invest: async (amount: string, context: AgentContext): Promise<ToolResult> => {
        // In a real scenario, this would interact with a smart contract (e.g., AAVE Pool, Staking Contract).
        // For verify, we send funds to a "Vault" address on Arc Testnet.
        const VAULT_ADDRESS = "0x7890123456789012345678901234567890123456"; // Dummy Vault

        try {
            const hash = await sendTransfer(VAULT_ADDRESS, amount, CLIENT_URL, CLIENT_KEY, context.session);
            return {
                success: true,
                message: `Successfully staked ${amount} USDC into the Yield Vault! 🚀 Earning 5% APY.`,
                data: { hash, explorer: `https://explorer-testnet.arc.circle.com/tx/${hash}` },
                action: "tx_link"
            };
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Investment failed: ${e.message || "Unknown error"}` };
        }
    }
};
