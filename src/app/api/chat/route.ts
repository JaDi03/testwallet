// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        console.log("🔹 AI Request Received:", messages.length, "messages");

        const result = await generateText({
            model: google('gemini-2.5-flash-lite'),
            messages,
            system: `You are the 'Arc Native Smart Wallet' AI. 
    Arc Testnet is the HUB of the user's financial life. Everything starts here.
    
    Philosophy:
    1. **Arc-First**: All funds are assumed to be on Arc Testnet initially.
    2. **Seamless Expansion**: If a user wants to do something on another chain (Base, Arbitrum, etc.), you automatically use the 'bridge' tool to move funds FROM Arc to that destination. 
    3. **Omni-chain Reach**: You can send money (transfer), invest, or provide liquidity on any chain, but you ALWAYS originate the capital from Arc.
    
    Rules:
    1. **Transfer**: If the destination is another chain, use 'bridge'. If same-chain (Arc), use 'transfer'.
    2. **Identity**: You are an Arc Native agent. You don't "switch" between nets; you "extend" Arc to other nets using CCTP.
    3. **Language**: Always reply in the user's detected language.
    
    Current Hub: Arc Testnet (Chain ID 5042002).
    Supported Extensions: Base, Ethereum Sepolia, Arbitrum, Optimism, Avalanche, Polygon.
    `,
            tools: {
                getBalance: tool({
                    description: 'Get the USDC balance of the user on a specific chain (optional)',
                    parameters: z.object({
                        chain: z.string().optional().describe('The network to check balance (e.g. Arc, Base, ETH)')
                    }),
                }) as any,
                transfer: tool({
                    description: 'Send USDC to a specific address on a specific chain (optional)',
                    parameters: z.object({
                        to: z.string().describe('The destination 0x address'),
                        amount: z.string().describe('The amount to send'),
                        chain: z.string().optional().describe('The network to send on (defaults to current)')
                    }),
                }) as any,
                invest: tool({
                    description: 'Invest or Stake USDC into a Yield Vault',
                    parameters: z.object({
                        amount: z.string().describe('The amount to invest'),
                    }),
                }) as any,
                addLiquidity: tool({
                    description: 'Add liquidity to a DeFi Pool',
                    parameters: z.object({
                        tokenA: z.string().describe('The first token symbol (e.g. USDC)'),
                        tokenB: z.string().describe('The second token symbol (e.g. ETH)'),
                        amount: z.string().describe('The amount of Token A to deposit'),
                    }),
                }) as any,
                bridge: tool({
                    description: 'Bridge USDC to another chain (Base, Sepolia, Monad) using CCTP. Tip: Defaults to Arc as source if not specified.',
                    parameters: z.object({
                        sourceChain: z.string().optional().describe('The source chain to bridge from (e.g. Arc, Base Sepolia, ETH Sepolia)'),
                        destinationChain: z.string().describe('The target chain (e.g. Base Sepolia, ETH Sepolia)'),
                        amount: z.string().describe('The amount of USDC to bridge'),
                        recipient: z.string().optional().describe('The destination 0x address (if different from sender)'),
                    }),
                }) as any,
                faucet: tool({
                    description: 'Get instructions for the Testnet Faucet',
                    parameters: z.object({}),
                }) as any,
            },
        });

        return Response.json({
            text: result.text,
            toolCalls: result.toolCalls
        });
    } catch (error: any) {
        console.error("🔥 AI SERVER ERROR:", error);
        // Log more detail if it's a model error
        if (error.response) {
            console.error("📦 API Response Error:", await error.response.text());
        }
        return Response.json({
            error: error.message || "Unknown AI Error",
            details: error.stack || error
        }, { status: 500 });
    }
}
