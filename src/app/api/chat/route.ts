// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SKILL_REGISTRY } from '@/agent/skills/registry';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Allow streaming responses (though we might return JSON for simplicity first)
// Max duration for Edge/Serverless functions (Local can be infinite, Vercel Pro 300s, Enterprise 900s)
// Sepolia Finality for CCTP is ~12-15 mins. Let's set to 900s (15m) for local dev.
export const maxDuration = 900;

// Initialize Google AI
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        const { messages, userId, userAddress: bodyUserAddress } = await req.json();

        console.log("🔹 AI Request (Google SDK):", messages.length, "messages", userId ? `from user ${userId}` : "(no userId)");

        // 1. Prepare Tools (Function Declarations)
        const tools = [{
            functionDeclarations: SKILL_REGISTRY.map(skill => {
                const jsonSchema = zodToJsonSchema(skill.parameters);
                // Clean schema for Gemini
                const cleanSchema = {
                    type: 'object',
                    properties: (jsonSchema as any).properties,
                    required: (jsonSchema as any).required,
                };
                if (cleanSchema.required && cleanSchema.required.length === 0) {
                    delete cleanSchema.required;
                }
                return {
                    name: skill.name,
                    description: skill.description,
                    parameters: cleanSchema,
                };
            })
        }];

        console.log("🔹 Gemini Tools Payload:", JSON.stringify(tools, null, 2));

        // 2. Prepare Chat History (Convert Vercel Message format to Google format)
        // Strict Validation: History MUST start with 'user'

        let rawHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Find the first 'user' message index
        const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');

        let validHistory: any[] = [];
        if (firstUserIndex !== -1) {
            validHistory = rawHistory.slice(firstUserIndex);
        } else {
            validHistory = [];
        }

        const lastMessage = messages[messages.length - 1];
        const userPrompt = lastMessage.content;

        // 2a. Fetch User Context (Address)
        // We use 'arcTestnet' as the default to get the UNIVERSAL address (same for all EVM chains)
        let userAddress = bodyUserAddress || "0x...";
        // If provided a userId but NO address, fetch it (just in case)
        if (userId && (!bodyUserAddress || bodyUserAddress === "0x...")) {
            try {
                // Import dynamically to avoid build issues if not used
                const { getOrCreateWallet } = await import('@/lib/serverWallet');
                const wallet = await getOrCreateWallet(userId, 'arcTestnet');
                userAddress = wallet.address;
                console.log(`🔹 Context: User ${userId} -> ${userAddress}`);
            } catch (e) {
                console.error("Failed to fetch user wallet for context:", e);
                userAddress = "Unknown (Error fetching wallet)";
            }
        }

        // 3. Initialize Model with PERONA
        const { AGENT_PERSONA } = await import("@/agent/prompts");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: AGENT_PERSONA(userAddress, SKILL_REGISTRY),
            tools: tools as any,
            toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
        });

        // 4. Start Chat & Send Message
        const chat = model.startChat({
            history: validHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0, // Force deterministic behavior to reduce hallucinations
            },
        });

        console.log(`🔹 Sending prompt to Gemini: "${userPrompt.substring(0, 50)}..."`);
        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;

        // DEBUG: Log the full response to see if it's returning text instead of tool calls
        console.log("🔹 Gemini Raw Response Candidates:", JSON.stringify(response.candidates, null, 2));

        // 5. Handle Function Calls
        // NOTE: functionCalls() returns an array. We MUST handle all of them or ensure response parts match.
        // Even if we only support one, we must send back responses for all detected calls to satisfy the API.
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            console.log(`[Agent] Detected ${calls.length} tool calls.`);

            const functionResponses = [];

            for (const call of calls) {
                console.log(`[Agent] Executing: ${call.name}`, call.args);

                const skill = SKILL_REGISTRY.find(s => s.name === call.name);
                let toolResult;

                if (skill) {
                    const context = { userAddress: userAddress, userId: userId, session: null };
                    try {
                        toolResult = await skill.execute(call.args, context);
                    } catch (err: any) {
                        toolResult = { success: false, message: `Error executing tool: ${err.message}` };
                    }
                } else {
                    console.error(`Tool ${call.name} not found.`);
                    toolResult = { error: "Tool not found" };
                }

                console.log(`[Agent] Result for ${call.name}:`, JSON.stringify(toolResult).substring(0, 100) + "...");

                // Construct the response part for THIS specific call
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { name: call.name, content: toolResult }
                    }
                });
            }

            // Send ALL results back to Model (Turn 2)
            // The API expects an array of parts.
            const finalResult = await chat.sendMessage(functionResponses);
            const finalResponse = await finalResult.response;
            const finalText = finalResponse.text();

            return Response.json({ text: finalText });
        }

        // Normal Text Response
        const text = response.text();
        return Response.json({ text: text });

    } catch (error: any) {
        console.error("🔥 AI SERVER ERROR (Google SDK):", error);
        return Response.json({ error: error.message || "Unknown AI Error" }, { status: 500 });
    }
}
