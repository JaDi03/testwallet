import { WalletSkills } from "./skills/core/walletSkills";
import { InvestSkill } from "./skills/defi/investSkill";
import { AddLiquiditySkill } from "./skills/defi/addLiquidity";
import { BridgeSkill } from "./skills/cross-chain/bridgeSkill";
import { AgentContext } from "./types";

export type AgentResponse = {
    text: string;
    action?: "faucet_card" | "tx_link" | "show_plan";
    data?: any;
};

// ... imports at top ... (WalletSkills, etc.)
// KEEP IMPORTS

// Update the function interface (implementation)
export async function processUserIntent(
    input: string,
    userAddress: string,
    session?: any,
    history: any[] = [],
    userId?: string
): Promise<AgentResponse> {
    const context: AgentContext = { userAddress, session, userId };

    try {
        // 🚨 Regex Override: Keep for simple explicit commands
        const bridgeRegex = /(?:bridge|puente|envia|send)\s+([\d\.]+)\s*(?:usdc)?\s*(?:to|a|para)\s*(?:sepolia|eth sepolia|base|base sepolia)(?:\s+(0x[a-fA-F0-9]{40}))?/i;
        const match = input.match(bridgeRegex);

        if (match && input.length > 5) {
            console.log("⚡ Regex Override: Detected Bridge Intent");
            const amount = match[1];
            const recipient = match[2] || userAddress;
            const chainRaw = match[0].toLowerCase();
            const destinationChain = chainRaw.includes('base') ? 'base' : 'sepolia';

            const args = { amount, recipient, destinationChain };
            console.log(`🤖 Force-executed tool: bridge`, args);
            const res = await BridgeSkill.bridgeUSDC(args, context);

            return {
                text: res.success ? (res.message || "Bridge initiated.") : `❌ Error: ${res.message}`,
                action: res.action as any,
                data: res.data
            };
        }

        // 1. Prepare Messages for the AI Brain (Format: { role, content })
        const aiMessages = [
            ...history.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })),
            { role: 'user', content: input }
        ];

        // 2. Call the AI Brain
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: aiMessages })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `AI Brain error ${response.status}`);
        }

        const aiResult = await response.json();
        console.log("🔍 PRE-PARSE AI RESULT:", JSON.stringify(aiResult, null, 2));

        // aiResult structure from Vercel AI SDK 'generateText':
        // { text: string, toolCalls: [] }

        // 2. Handle Tool Calls
        if (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
            const toolCall = aiResult.toolCalls[0]; // For V1, handle first tool
            const name = toolCall.toolName;
            const args = toolCall.input;

            console.log(`🤖 AI Decided to call tool: ${name}`, args);

            let res: any;

            switch (name) {
                case 'getBalance':
                    res = await WalletSkills.getBalance(context, args.chain, args.token);
                    break;
                case 'transfer':
                    res = await WalletSkills.transfer(args.to, args.amount, context, args.chain);
                    break;
                case 'requestFaucet': // mapped from AI 'faucet' tool if named differently, but I named it 'faucet' in route. Let's fix map.
                case 'faucet':
                    res = await WalletSkills.requestFaucet(context);
                    break;
                case 'invest':
                    res = await InvestSkill.invest(args.amount, context);
                    break;
                case 'addLiquidity':
                    res = await AddLiquiditySkill.execute(args.tokenA, args.tokenB, args.amount, context);
                    break;
                case 'bridge':
                    res = await BridgeSkill.bridgeUSDC(args, context);
                    break;
                case 'swap': {
                    const { SwapSkill } = await import("./skills/defi/swapSkill");
                    console.log(`[Engine] Swap Args:`, JSON.stringify(args));

                    // Comprehensive alias mapping for AI's creative parameter naming
                    const fromToken = args.fromToken || args.from_token || args.token_in || args.tokenIn ||
                        args.currency || args.fromCurrency || args.sellToken || args.token_sell ||
                        args.sell || args.from || args.tokenSymbolIn;

                    const toToken = args.toToken || args.to_token || args.token_out || args.tokenOut ||
                        args.destination_currency || args.toCurrency || args.buyToken || args.token_buy ||
                        args.buy || args.to || args.token || args.tokenSymbolOut;

                    console.log(`[Engine] Resolved swap tokens: ${fromToken} -> ${toToken}`);

                    res = await SwapSkill.swap(
                        fromToken,
                        toToken,
                        args.amount,
                        context,
                        args.maxSlippage,
                        args.chain
                    );
                    break;
                }
                case 'getQuote': {
                    const { SwapSkill: QuoteSkill } = await import("./skills/defi/swapSkill");

                    const fromToken = args.fromToken || args.from_token || args.token_in || args.tokenIn ||
                        args.currency || args.fromCurrency || args.sellToken || args.token_sell ||
                        args.sell || args.from || args.tokenSymbolIn;

                    const toToken = args.toToken || args.to_token || args.token_out || args.tokenOut ||
                        args.destination_currency || args.toCurrency || args.buyToken || args.token_buy ||
                        args.buy || args.to || args.token || args.tokenSymbolOut;

                    res = await QuoteSkill.getQuote(
                        fromToken,
                        toToken,
                        args.amount,
                        args.chain
                    );
                    break;
                }
                default:
                    return { text: "I don't know how to execute that tool yet." };
            }

            // Return the result
            const aiText = aiResult.text ? aiResult.text + "\n\n" : "";

            if (res.success) {
                return {
                    text: aiText + (res.message || "Action completed successfully."),
                    action: res.action as any,
                    data: res.data
                };
            } else {
                return { text: aiText + `❌ Error: ${res.message}` };
            }
        }

        // 3. Handle Pure Text Response (Conversational)
        return { text: aiResult.text || "I didn't understand that." };

    } catch (error) {
        console.error("Agent Engine Error:", error);
        return { text: "⚠️ My brain is having trouble connecting. Please try again." };
    }
}
