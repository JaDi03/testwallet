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
    Philosophy:
    1. **Multi-Chain Native**: You are an expert that operates natively across Arc, Ethereum Sepolia, and Base Sepolia.
    2. **Local Priority**: If the user has funds on Sepolia or Base, you MUST execute trades (swap) DIRECTLY on those chains. NEVER claim you can only do it on Arc.

    Rules:
    1. **SWAP ANYWHERE**: You can swap on Arc, Sepolia, and Base. It is FALSE to say otherwise.
    2. **Context Persistence**: If the user says "sell el WETH", use the chain where it was bought (e.g., Sepolia).
    3. **Tool Parameters**: Always provide 'fromToken', 'toToken', 'amount', and 'chain'.
    4. **Language**: Always reply in the user's detected language.
    
    Current Hub: Arc Testnet (Chain ID 5042002).
    Supported Extensions: Base, Ethereum Sepolia.`,
            tools: {
                getBalance: tool({
                    description: 'Get asset balances (ETH, USDC, WETH, etc.) for the user. If "chain" is omitted, returns balances across ALL supported chains (Arc, Sepolia, Base). You can also specify a "token" symbol or address to check a specific asset.',
                    parameters: z.object({
                        chain: z.string().optional().describe('The network to check balance (e.g. Arc, Base, ETH). Leave empty for ALL.'),
                        token: z.string().optional().describe('Specific token symbol (e.g. BNB, PEPE) or 0x address to check.')
                    }),
                }) as any,
                transfer: tool({
                    description: 'Send assets (mainly USDC) to a specific address on a specific chain.',
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
                    description: 'Bridge USDC to another chain (Base, Sepolia) using CCTP.',
                    parameters: z.object({
                        sourceChain: z.string().optional().describe('The source chain'),
                        destinationChain: z.string().describe('The target chain'),
                        amount: z.string().describe('The amount of USDC to bridge'),
                        recipient: z.string().optional().describe('The destination 0x address'),
                    }),
                }) as any,
                swap: tool({
                    description: 'Swap tokens on a DEX. Use symbols like "USDC", "WETH". System handles addresses.',
                    parameters: z.object({
                        fromToken: z.string().describe('Symbol of token to sell'),
                        toToken: z.string().describe('Symbol of token to buy'),
                        amount: z.string().describe('Amount string'),
                        maxSlippage: z.number().optional().describe('Slippage %'),
                        chain: z.string().optional().describe('Network')
                    }),
                }) as any,
                getQuote: tool({
                    description: 'Get a price quote for a swap.',
                    parameters: z.object({
                        fromToken: z.string().describe('Token to sell'),
                        toToken: z.string().describe('Token to buy'),
                        amount: z.string().describe('Amount'),
                        chain: z.string().optional().describe('Network')
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
