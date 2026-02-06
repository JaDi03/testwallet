/**
 * Server-Side Wallet Operations using Circle Developer-Controlled Wallets
 * This module enables the Agent to execute transactions autonomously without user signatures.
 */
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

// Initialize the Circle SDK client
let circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

export function getCircleClient() {
    if (!circleClient) {
        const apiKey = process.env.CIRCLE_API_KEY;
        const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

        if (!apiKey || !entitySecret) {
            throw new Error('Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in environment variables');
        }

        circleClient = initiateDeveloperControlledWalletsClient({
            apiKey,
            entitySecret,
        });
    }
    return circleClient;
}

// Cache for wallet set ID (created once per application)
let cachedWalletSetId: string | null = null;

/**
 * Get or create a wallet set for the application.
 * A wallet set is a container for developer-controlled wallets.
 */
async function getOrCreateWalletSet(): Promise<string> {
    if (cachedWalletSetId) return cachedWalletSetId;

    const client = getCircleClient();

    try {
        // Try to list existing wallet sets
        const { data } = await client.listWalletSets({});
        console.log('[ServerWallet] Wallet sets found:', data?.walletSets?.length || 0);

        if (data?.walletSets && data.walletSets.length > 0) {
            // Filter for OUR specific set name and DEVELOPER custody type
            const targetSet = data.walletSets.find((ws: any) =>
                ws.name === 'ArcHub-Autonomous-v3' && ws.custodyType === 'DEVELOPER'
            );

            if (targetSet) {
                cachedWalletSetId = targetSet.id!;
                console.log('[ServerWallet] Using existing wallet set:', cachedWalletSetId);
                return cachedWalletSetId;
            } else {
                // If not found by name, pick the first DEVELOPER set as fallback
                const fallbackSet = data.walletSets.find((ws: any) => ws.custodyType === 'DEVELOPER');
                if (fallbackSet) {
                    cachedWalletSetId = fallbackSet.id!;
                    console.log('[ServerWallet] Target set not found, falling back to:', cachedWalletSetId);
                    return cachedWalletSetId;
                }
            }
        }
    } catch (e: any) {
        console.log('[ServerWallet] Error listing wallet sets:', e.message);
    }

    // Create a new DEVELOPER wallet set
    console.log('[ServerWallet] Creating new DEVELOPER wallet set...');
    try {
        const { data: newSet } = await client.createWalletSet({
            name: 'ArcHub-Autonomous-v3',
            idempotencyKey: uuidv4(),
        });

        console.log('[ServerWallet] Create wallet set response:', JSON.stringify(newSet, null, 2));
        cachedWalletSetId = newSet?.walletSet?.id!;
        console.log('[ServerWallet] Created new wallet set:', cachedWalletSetId);
        return cachedWalletSetId;
    } catch (createError: any) {
        console.error('[ServerWallet] Failed to create wallet set:', createError.message);
        throw createError;
    }
}

// Cache for user wallets: userId -> Map<blockchainId, walletData>
const walletCache = new Map<string, Map<string, { walletId: string; address: string; accountType?: string }>>();

const getBlockchainId = (chain: string): string => {
    const map: Record<string, string> = {
        'arcTestnet': 'ARC-TESTNET',
        'ethereumSepolia': 'ETH-SEPOLIA',
        'baseSepolia': 'BASE-SEPOLIA',
        'arbitrumSepolia': 'ARB-SEPOLIA',
        'optimismSepolia': 'OP-SEPOLIA',
        'avalancheFuji': 'AVAX-FUJI',
        'polygonAmoy': 'MATIC-AMOY'
    };
    return map[chain] || map[chain.toLowerCase()] || chain;
};

/**
 * Get or create a wallet for a specific user/session on a specific blockchain.
 * For PC-first development, use a fixed session ID like "dev_user_001".
 */
export async function getOrCreateWallet(userId: string, blockchain: string = 'arcTestnet'): Promise<{ walletId: string; address: string; accountType?: string }> {
    const blockchainId = getBlockchainId(blockchain);

    // Check cache first
    let userWallets = walletCache.get(userId);
    if (!userWallets) {
        userWallets = new Map();
        walletCache.set(userId, userWallets);
    }

    if (userWallets.has(blockchainId)) {
        return userWallets.get(blockchainId)!;
    }

    const client = getCircleClient();
    const walletSetId = await getOrCreateWalletSet();
    console.log(`[ServerWallet] Ensuring wallet exists for ${userId} on ${blockchainId}...`);

    // 1. Check if user already has a wallet on ANY blockchain (lookup by refId)
    let existingRefId: string | null = null;
    let foundWallets: any[] = [];
    try {
        // Query Circle directly by refId for efficiency and to avoid pagination issues
        const { data } = await client.listWallets({ walletSetId, refId: userId });
        foundWallets = data?.wallets?.filter((w: any) => w.accountType === 'SCA') || [];

        if (foundWallets.length > 0) {
            existingRefId = foundWallets[0].refId || userId;
            console.log(`[ServerWallet] User ${userId} already has SCA wallets. Found ${foundWallets.length}.`);

            // Map all found wallets to cache to avoid future API calls
            foundWallets.forEach((w: any) => {
                userWallets!.set(w.blockchain, {
                    walletId: w.id!,
                    address: w.address!,
                    accountType: 'SCA'
                });
            });

            if (userWallets.has(blockchainId)) {
                return userWallets.get(blockchainId)!;
            }
        }
    } catch (e: any) {
        console.log('[ServerWallet] Error listing wallets:', e.message);
    }

    // 2. CRITICAL: To get the SAME address across EVM chains, we MUST create wallets 
    // in a SINGLE API call with multiple blockchains. Separate calls = separate addresses.
    console.log(`[ServerWallet] Creating UNIVERSAL SCA WALLET (same address across chains) for ${userId}...`);

    const allChains = ['ARC-TESTNET', 'ETH-SEPOLIA', 'BASE-SEPOLIA'];
    const WALLET_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const setIdempotencyKey = uuidv5(`universal-wallet-${userId}`, WALLET_NAMESPACE);

    try {
        const { data: newWallets } = await client.createWallets({
            walletSetId,
            blockchains: allChains as any,
            accountType: 'SCA',
            count: 1,
            idempotencyKey: setIdempotencyKey,
            // CRITICAL: For multi-blockchain creation, pass a SINGLE metadata object, NOT an array!
            // This single metadata applies to all blockchains and ensures deterministic address derivation.
            metadata: [
                {
                    name: `AGENT-SCA-UNIVERSAL`,
                    refId: existingRefId || userId
                }
            ] as any,
        });

        if (!newWallets?.wallets || newWallets.wallets.length === 0) {
            throw new Error('Failed to create wallets - empty response');
        }

        // Map all created wallets to cache
        let requestedResult: any = null;
        newWallets.wallets.forEach((w: any) => {
            const result = {
                walletId: w.id!,
                address: w.address!,
                accountType: 'SCA'
            };
            userWallets!.set(w.blockchain, result);
            if (w.blockchain === blockchainId) requestedResult = result;
        });

        const universalAddress = newWallets.wallets[0].address;
        console.log(`[ServerWallet] ✅ Created ${newWallets.wallets.length} SCA wallets with UNIVERSAL address: ${universalAddress}`);

        // Verify all addresses match
        const addressSet = new Set(newWallets.wallets.map((w: any) => w.address));
        if (addressSet.size === 1) {
            console.log(`[ServerWallet] ✅ Address consistency verified across ${newWallets.wallets.length} chains`);
        } else {
            console.warn(`[ServerWallet] ⚠️ WARNING: Got ${addressSet.size} different addresses:`, Array.from(addressSet));
        }

        return requestedResult || userWallets.get(blockchainId)!;

    } catch (createError: any) {
        console.error(`[ServerWallet] Universal SCA creation error:`, createError.message);
        throw createError;
    }
}

/**
 * Execute a transaction autonomously using the server-controlled wallet.
 * This is the key function that enables the Agent to act without user interaction.
 */
export async function executeTransaction(
    walletId: string,
    toAddress: string,
    amount: string,
    tokenAddress?: string,
    blockchain: string = 'ARC-TESTNET'
): Promise<string> {
    const client = getCircleClient();
    const blockchainId = getBlockchainId(blockchain);

    console.log(`[ServerWallet] Executing transaction from wallet ${walletId} to ${toAddress}`);
    console.log(`[ServerWallet] Amount: ${amount}, Token: ${tokenAddress || 'Native'}, Chain: ${blockchainId}`);
    console.log(`[ServerWallet] DEBUG - typeof amount:`, typeof amount, `value:`, amount);

    try {
        // When using tokenAddress, the blockchain parameter is REQUIRED by Circle SDK
        // according to TokenAddressAndBlockchainInput interface
        const txParams = {
            walletId,
            blockchain: blockchainId,
            tokenAddress,
            destinationAddress: toAddress,
            amount: [amount], // SDK expects array of decimal strings
            fee: {
                type: 'level',
                config: {
                    feeLevel: 'MEDIUM'
                }
            },
            idempotencyKey: uuidv4(),
        };

        console.log(`[ServerWallet] DEBUG - Full transaction params:`, JSON.stringify(txParams, null, 2));

        const { data: tx } = await (client as any).createTransaction(txParams);

        console.log(`[ServerWallet] Transaction created:`, (tx as any)?.id || (tx as any)?.data?.id || (tx as any)?.data?.transaction?.id);
        return (tx as any)?.id || (tx as any)?.data?.id || (tx as any)?.data?.transaction?.id || '';
    } catch (error: any) {
        console.error(`[ServerWallet] Transaction error:`, error.message);
        console.error(`[ServerWallet] Full error object:`, JSON.stringify(error, null, 2));
        throw error;
    }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txId: string): Promise<any> {
    const client = getCircleClient();
    try {
        const { data } = await client.getTransaction({ id: txId });
        return data?.transaction;
    } catch (error: any) {
        console.error(`[ServerWallet] Error getting transaction:`, error.message);
        throw error;
    }
}

/**
 * Execute a smart contract call
 */
export async function executeContractCall(
    walletId: string,
    contractAddress: string,
    functionSignature: string,
    parameters: any[],
    blockchain: string = 'ARC-TESTNET'
): Promise<{ success: boolean; txHash?: string; error?: string; circleTxId?: string; needsPolling?: boolean }> {
    const client = getCircleClient();
    const blockchainId = getBlockchainId(blockchain);

    console.log(`[ServerWallet] Executing contract call: ${functionSignature} on ${contractAddress}`);

    try {
        const { data: txData } = await (client as any).createContractExecutionTransaction({
            walletId,
            blockchain: blockchainId, // CRITICAL: Must specify which network
            abiFunctionSignature: functionSignature,
            abiParameters: parameters,
            contractAddress,
            fee: {
                type: 'level',
                config: {
                    feeLevel: 'MEDIUM'
                }
            },
            idempotencyKey: uuidv4(),
        });

        const circleTxId = (txData as any)?.id || (txData as any)?.data?.id || (txData as any)?.data?.transaction?.id;
        if (!circleTxId) {
            console.error(`[ServerWallet] Full response from Circle:`, JSON.stringify(txData, null, 2));
            throw new Error('Failed to create transaction - no ID returned');
        }

        console.log(`[ServerWallet] Transaction created in Circle: ${circleTxId}. Polling for blockchain hash...`);

        // Poll for blockchain hash using Circle SDK (NOT a custom API endpoint)
        // This uses client.getTransaction which is the proper SDK method
        let txHash: string | undefined;
        for (let i = 0; i < 15; i++) {
            try {
                const { data: statusData } = await client.getTransaction({ id: circleTxId });
                txHash = (statusData as any)?.transaction?.txHash || (statusData as any)?.txHash;
                if (txHash && txHash.startsWith('0x')) {
                    console.log(`[ServerWallet] Blockchain Hash found after ${i + 1} attempts: ${txHash}`);
                    break;
                }
            } catch (pollErr) { /* ignore polling errors */ }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!txHash || !txHash.startsWith('0x')) {
            throw new Error(`Transaction ${circleTxId} created but blockchain hash not found after 30 seconds. Please try again.`);
        }

        return {
            success: true,
            txHash: txHash,
            circleTxId
        };
    } catch (error: any) {
        console.error(`[ServerWallet] Contract call error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get wallet balance for a specific token
 */
export async function getWalletBalance(
    walletId: string,
    tokenAddress?: string
): Promise<string> {
    const client = getCircleClient();
    try {
        const { data } = await client.getWalletTokenBalance({
            id: walletId,
            tokenAddress
        });

        // SUPPORT BOTH FORMATS: Some SDK versions return .tokenBalance, others .tokenBalances array
        if ((data as any).tokenBalances && Array.isArray((data as any).tokenBalances)) {
            return (data as any).tokenBalances[0]?.amount || '0';
        }

        return (data as any).tokenBalance?.amount || '0';
    } catch (error: any) {
        console.error(`[ServerWallet] Error getting balance:`, error.message);
        return '0';
    }
}