
import { AgentContext, ToolResult } from "../../types";
import {
    createPublicClient,
    http,
    encodeFunctionData,
    parseUnits,
    formatUnits,
    pad,
    defineChain
} from "viem";
import { arcTestnet } from "@/lib/wallet-sdk";
import {
    CCTP_CONFIG,
    SupportedChain,
    USDC_ABI,
    TOKEN_MESSENGER_ABI,
    MESSAGE_TRANSMITTER_ABI
} from "./config";

// --- Helpers ---
export function resolveChainKey(input: string): SupportedChain | null {
    const normalized = input.toLowerCase().trim().replace(/[\s\-_]+/g, '');
    const mappings: Record<string, SupportedChain> = {
        'base': 'baseSepolia',
        'basesepolia': 'baseSepolia',
        'eth': 'ethereumSepolia',
        'ethereum': 'ethereumSepolia',
        'sepolia': 'ethereumSepolia',
        'ethereumsepolia': 'ethereumSepolia',
        'ethsepolia': 'ethereumSepolia',
        'arb': 'arbitrumSepolia',
        'arbitrum': 'arbitrumSepolia',
        'arbitrumsepolia': 'arbitrumSepolia',
        'opt': 'optimismSepolia',
        'optimism': 'optimismSepolia',
        'optimismsepolia': 'optimismSepolia',
        'op': 'optimismSepolia',
        'avax': 'avalancheFuji',
        'avalanche': 'avalancheFuji',
        'avalanchefuji': 'avalancheFuji',
        'fuji': 'avalancheFuji',
        'poly': 'polygonAmoy',
        'polygon': 'polygonAmoy',
        'polygonamoy': 'polygonAmoy',
        'amoy': 'polygonAmoy',
        'matic': 'polygonAmoy',
        'arc': 'arcTestnet',
        'arctestnet': 'arcTestnet'
    };
    return mappings[normalized] || null;
}

async function fetchCircleAttestation(sourceTx: string, sourceDomain: number): Promise<{ message: string, attestation: string } | null> {
    try {
        const baseUrl = "https://iris-api-sandbox.circle.com/v2/messages";
        const response = await fetch(`${baseUrl}/${sourceDomain}?transactionHash=${sourceTx}`);
        if (!response.ok) return null;
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
            const msg = data.messages[0];
            if (msg.status === 'complete') {
                return {
                    message: msg.message,
                    attestation: msg.attestation
                };
            }
        }
        return null;
    } catch (e) {
        console.error("Error fetching attestation:", e);
        return null;
    }
}

export const BridgeSkill = {

    bridgeUSDC: async (
        params: { amount: string | number; destinationChain?: string; destination_chain?: string; destination_address?: string; sourceChain?: string; recipient?: string; to?: string },
        context: AgentContext
    ): Promise<ToolResult> => {
        try {
            console.log("[BridgeSkill] Bridge Params:", JSON.stringify(params));
            // Normalize parameters
            const destChainInput = (params.destinationChain || params.destination_chain) as string;
            const { amount, sourceChain, recipient, to, destination_address } = params;
            const finalRecipient = recipient || to || destination_address || context.userAddress;

            if (!destChainInput) {
                return { success: false, message: "Missing destination chain parameter." };
            }

            // 1. Resolve Chains
            const srcKey = 'arcTestnet';
            const destKey = resolveChainKey(destChainInput);
            console.log(`[BridgeSkill] Chain Resolution: input="${destChainInput}" -> resolved="${destKey}"`);

            if (!destKey || !CCTP_CONFIG[destKey]) {
                return { success: false, message: `Unsupported destination chain: ${destChainInput}` };
            }

            const srcConfig = CCTP_CONFIG[srcKey];
            const destConfig = CCTP_CONFIG[destKey];
            const parsedAmount = parseUnits(amount.toString(), 6); // Arc USDC uses 6 decimals

            console.log(`⛓️ Chains: ${srcConfig.name} (${srcKey}) -> ${destConfig.name} (${destKey})`);

            // 2. Identify Wallet and Mode
            const isAutonomous = !context.session?.credential;
            let senderAddress: string;
            let agentDestAddress: string;
            const userId = (context as any).userId;
            if (!userId) {
                return { success: false, message: 'Error: Missing userId in context. Cannot proceed with autonomous bridge.' };
            }

            if (isAutonomous) {
                console.log("[BridgeSkill] 🤖 Autonomous Mode: Ensuring wallets exist on both chains...");

                // Get Arc Wallet using dynamic userId
                const arcWalletResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: 'arcTestnet' }),
                });
                const arcWalletData = await arcWalletResp.json();
                if (!arcWalletData.success) return { success: false, message: "Failed to get Arc autonomous wallet." };
                senderAddress = arcWalletData.address;

                // Get Destination Wallet (e.g., Base) using same userId for consistent address
                const destWalletResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: destKey }),
                });
                const destWalletData = await destWalletResp.json();
                if (!destWalletData.success) return { success: false, message: `Failed to get ${destKey} autonomous wallet.` };
                agentDestAddress = destWalletData.address;

                console.log(`🤖 Agent Wallets: Arc=${senderAddress}, ${destKey}=${agentDestAddress}`);
            } else {
                console.log("[BridgeSkill] 👤 User Mode: Using Passkey Wallet");
                senderAddress = context.session.address;
                agentDestAddress = senderAddress; // User usually uses the same address across EVM chains
            }

            // 3. Setup Public Client for Arc
            const srcPublic = createPublicClient({ chain: arcTestnet, transport: http() });

            // 4. Check source balance
            const srcBal = await srcPublic.readContract({
                address: srcConfig.usdc as `0x${string}`,
                abi: USDC_ABI,
                functionName: 'balanceOf',
                args: [senderAddress]
            });

            if ((srcBal as bigint) < parsedAmount) {
                return { success: false, message: `Insufficient funds on Arc Hub. Have: ${formatUnits(srcBal as bigint, 6)} USDC, Need: ${amount}` };
            }

            // 5. Execute "Burn"
            let burnHash: string = ''; // Initialize to satisfy TypeScript

            if (isAutonomous) {
                // Check allowance
                const allowance = await srcPublic.readContract({
                    address: srcConfig.usdc as `0x${string}`,
                    abi: USDC_ABI,
                    functionName: 'allowance',
                    args: [senderAddress, srcConfig.tokenMessenger]
                });

                if ((allowance as bigint) < parsedAmount) {
                    console.log("[BridgeSkill] 📤 Approving USDC for CCTP...");
                    const walletInfo = await (await fetch('/api/wallet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: 'arcTestnet' })
                    })).json();

                    const approveResp = await fetch('/api/wallet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'executeContractCall',
                            userId: userId,
                            walletId: walletInfo.walletId,
                            contractAddress: srcConfig.usdc,
                            functionSignature: 'approve(address,uint256)',
                            parameters: [srcConfig.tokenMessenger, parsedAmount.toString()],
                            blockchain: srcKey  // CRITICAL: Must pass blockchain for wallet lookup
                        }),
                    });
                    const approveResult = await approveResp.json();
                    if (!approveResult.success) return { success: false, message: `Approve failed: ${approveResult.error}` };
                }

                console.log(`[BridgeSkill] 📤 Burning to agent destination wallet: ${agentDestAddress}`);
                const walletInfo = await (await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: 'arcTestnet' })
                })).json();

                const burnResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'executeContractCall',
                        userId: userId,
                        walletId: walletInfo.walletId,
                        contractAddress: srcConfig.tokenMessenger,
                        functionSignature: 'depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32)',
                        parameters: [
                            parsedAmount.toString(),                              // amount
                            destConfig.domain.toString(),                         // destinationDomain
                            pad(agentDestAddress as `0x${string}`, { size: 32 }), // mintRecipient
                            srcConfig.usdc,                                       // burnToken
                            pad("0x0000000000000000000000000000000000000000" as `0x${string}`, { size: 32 }), // destinationCaller (0x0 = anyone can call)
                            "0",                                                  // maxFee (0 = no max fee limit)
                            "0"                                                   // minGasLimit (0 = default)
                        ],
                        blockchain: srcKey  // CRITICAL: Must pass blockchain for wallet lookup
                    }),
                });
                const burnResult = await burnResp.json();
                if (!burnResult.success) return { success: false, message: `Burn failed: ${burnResult.error}` };
                burnHash = burnResult.txHash;
            } else {
                // User-signed mode
                const { getChainSession } = await import('@/lib/wallet-sdk');
                const clientConf = { clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!, clientUrl: process.env.NEXT_PUBLIC_CLIENT_URL! };
                const { smartAccount: srcAccount, bundlerClient: srcBundler } = await getChainSession(srcConfig.transportSuffix, context.session.credential, clientConf);

                const calls: any[] = [];
                const allowance = await srcPublic.readContract({ address: srcConfig.usdc as `0x${string}`, abi: USDC_ABI, functionName: 'allowance', args: [srcAccount.address, srcConfig.tokenMessenger] });

                if ((allowance as bigint) < parsedAmount) {
                    calls.push({ to: srcConfig.usdc as `0x${string}`, data: encodeFunctionData({ abi: USDC_ABI, functionName: 'approve', args: [srcConfig.tokenMessenger, parsedAmount] }), value: BigInt(0) });
                }

                calls.push({
                    to: srcConfig.tokenMessenger as `0x${string}`,
                    data: encodeFunctionData({
                        abi: TOKEN_MESSENGER_ABI,
                        functionName: 'depositForBurn',
                        args: [parsedAmount, destConfig.domain, pad(finalRecipient as `0x${string}`, { size: 32 }), srcConfig.usdc, pad("0x0000000000000000000000000000000000000000", { size: 32 }), BigInt(0), 0]
                    }),
                    value: BigInt(0)
                });

                const hash = await srcBundler.sendUserOperation({ account: srcAccount, calls });
                const receipt = await srcBundler.waitForUserOperationReceipt({ hash });
                burnHash = receipt.userOpHash;
            }

            console.log(`🔥 Burn Hash: ${burnHash}`);

            // 6. Start Polling for Completion - CRITICAL: Pass userId to ensure same wallet is used
            BridgeSkill.completeBridge(burnHash, srcKey, destKey, finalRecipient, amount.toString(), userId);

            return {
                success: true,
                message: `🚀 Bridge started! I'm moving ${amount} USDC to ${destConfig.name}.\n\n🔥 Burn TX: ${burnHash}\n\nI will monitor the attestation and complete the transfer to ${finalRecipient} automáticamente.`,
                action: "tx_link",
                data: { hash: burnHash, explorer: `${srcConfig.explorer}/tx/${burnHash}` }
            };

        } catch (error: any) {
            console.error("[BridgeSkill] Error:", error);
            return { success: false, message: `Failed: ${error.message}` };
        }
    },

    completeBridge: async (burnTx: string, sourceChain: string, destinationChain: string, finalRecipient: string, amount: string, userId: string) => {
        // CRITICAL: userId MUST be provided - no more 'guest' fallback
        if (!userId) {
            console.error('[Bridge Monitor] CRITICAL ERROR: userId not provided to completeBridge!');
            return;
        }
        console.log(`📡 [Bridge Monitor] Starting autonomous completion for ${burnTx}...`);
        const srcConfig = CCTP_CONFIG[sourceChain as SupportedChain];
        const destConfig = CCTP_CONFIG[destinationChain as SupportedChain];

        try {
            let attestation = null;
            // Poll for up to 15 minutes
            for (let i = 0; i < 60; i++) {
                console.log(`⌛ Checking attestation (Attempt ${i + 1}/60)...`);
                attestation = await fetchCircleAttestation(burnTx, srcConfig.domain);
                if (attestation) break;
                await new Promise(r => setTimeout(r, 15000));
            }

            if (!attestation) throw new Error("Circle attestation timed out.");
            console.log("✅ Attestation received!");

            // 1. EXECUTE MINT on Destination using Agent's destination wallet
            console.log(`[Bridge Debug] Fetching wallet for userId=${userId}, blockchain=${destinationChain}`);
            const walletResp = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getOrCreateWallet', userId: userId, blockchain: destinationChain }),
            });
            const walletData = await walletResp.json();
            const { walletId, address: agentDestAddress, accountType } = walletData;
            console.log(`[Bridge Debug] Got wallet: walletId=${walletId}, address=${agentDestAddress}, accountType=${accountType}`);

            // --- GAS CHECK (Only for EOAs) ---
            if (accountType !== 'SCA') {
                console.log(`🔍 Checking gas balance for Agent EOA on ${destConfig.name}: ${agentDestAddress}`);
                const balanceResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getBalance', userId: userId, blockchain: destinationChain }),
                });
                const balanceData = await balanceResp.json();
                const nativeBalance = parseFloat(balanceData.balance?.native || '0');

                if (nativeBalance <= 0) {
                    console.error(`❌ [Bridge Monitor] Agent has no gas on ${destConfig.name}. Funding required.`);
                    throw new Error(`Insufficient gas (ETH) on ${destConfig.name}. Please fund the agent wallet at ${agentDestAddress} to complete the mint.`);
                }
            } else {
                console.log(`🚀 Agent is using Smart Account (SCA) - Bypassing local gas check for Gas Station support.`);
            }

            console.log(`📥 Executing Mint on ${destConfig.name} (Autonomous)...`);
            const mintResp = await fetch('/api/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'executeContractCall',
                    userId: userId,
                    walletId,
                    contractAddress: destConfig.messageTransmitter,
                    functionSignature: 'receiveMessage(bytes,bytes)',
                    parameters: [attestation.message, attestation.attestation],
                    blockchain: destinationChain  // CRITICAL: Must specify destination chain
                }),
            });

            const mintResult = await mintResp.json();
            if (!mintResult.success) {
                throw new Error(`Mint failed: ${mintResult.error}`);
            }
            console.log(`✨ [Bridge Monitor] SUCCESS! Mint TX: ${mintResult.txHash}`);

            // 2. EXECUTE FINAL TRANSFER if target recipient is different from agent
            console.log(`[Bridge Debug] finalRecipient: ${finalRecipient}`);
            console.log(`[Bridge Debug] agentDestAddress: ${agentDestAddress}`);
            console.log(`[Bridge Debug] Are they different? ${finalRecipient.toLowerCase() !== agentDestAddress.toLowerCase()}`);

            if (finalRecipient.toLowerCase() !== agentDestAddress.toLowerCase()) {
                console.log(`💸 Transferring ${amount} USDC from Agent to final recipient: ${finalRecipient}`);

                // Wait longer for Circle's indexers to update the balance after mint
                console.log(`⌛ Waiting 20s for balance indexing...`);
                await new Promise(r => setTimeout(r, 20000));

                // Verify balance before attempting transfer (CRITICAL: must use POST, not GET!)
                console.log(`[Bridge Debug] Checking balance for userId=${userId}, blockchain=${destinationChain}`);
                const balanceResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getBalance', userId: userId, blockchain: destinationChain }),
                });
                const balanceResult = await balanceResp.json();
                if (balanceResult.success) {
                    const balanceInUsdc = parseFloat(balanceResult.balance.usdc) / 1e6;
                    console.log(`💰 Agent wallet balance on ${destConfig.name}: ${balanceInUsdc} USDC`);
                    if (balanceInUsdc < parseFloat(amount)) {
                        console.warn(`⚠️ Insufficient balance (${balanceInUsdc} < ${amount}). Minted funds may not be indexed yet.`);
                    }
                }

                // CRITICAL: 'amount' is already in human-readable decimal format (e.g., "0.1")
                // The Circle SDK expects decimal strings, NOT raw units
                // Do NOT use parseUnits here - that would convert "0.1" to 100000000000000000 (18 decimals)
                console.log(`[Bridge Debug] Executing final transfer:`);
                console.log(`[Bridge Debug]   walletId=${walletId}`);
                console.log(`[Bridge Debug]   toAddress=${finalRecipient}`);
                console.log(`[Bridge Debug]   amount=${amount}`);
                console.log(`[Bridge Debug]   tokenAddress=${destConfig.usdc}`);
                console.log(`[Bridge Debug]   blockchain=${destinationChain}`);
                const transferResp = await fetch('/api/wallet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'executeTransaction',
                        userId: userId,
                        walletId,
                        toAddress: finalRecipient,
                        amount: amount, // Circle SDK expects decimal string (e.g., "0.1")
                        tokenAddress: destConfig.usdc,
                        blockchain: destinationChain
                    }),
                });
                const transferResult = await transferResp.json();
                if (transferResult.success) {
                    console.log(`✅ [Bridge Monitor] Final transfer successful: ${transferResult.txHash}`);
                } else {
                    console.error(`❌ [Bridge Monitor] Final transfer failed: ${transferResult.error}`);
                }
            }

        } catch (error: any) {
            console.error(`❌ [Bridge Monitor] Critical failure: ${error.message}`);
        }
    }
};
