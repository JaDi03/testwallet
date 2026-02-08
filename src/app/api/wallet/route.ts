/**
 * API Route for Server Wallet Operations
 * Exposes the developer-controlled wallet functions to the frontend and agent.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    getOrCreateWallet,
    executeTransaction,
    executeContractCall,
    getWalletBalance
} from '@/lib/serverWallet';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, userId, ...params } = body;
        // CRITICAL: userId must be provided - no more 'guest' fallback
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Missing userId parameter' }, { status: 400 });
        }
        const actualUserId = userId;

        switch (action) {
            case 'getOrCreateWallet': {
                const { blockchain } = params;
                const wallet = await getOrCreateWallet(actualUserId, blockchain);
                return NextResponse.json({ success: true, ...wallet });
            }

            case 'executeTransaction': {
                // CRITICAL CHANGE: Get wallet by userId+blockchain, NOT trust walletId from client
                // This ensures we ALWAYS use the correct wallet for the user, regardless of what the client sends
                const { toAddress, amount, tokenAddress, blockchain } = params;
                if (!blockchain) {
                    return NextResponse.json({ success: false, error: 'Missing blockchain parameter for executeTransaction' }, { status: 400 });
                }
                // Get the correct wallet for this user + blockchain combination
                const wallet = await getOrCreateWallet(actualUserId, blockchain);
                console.log(`[executeTransaction] Using wallet ${wallet.walletId} for userId=${actualUserId}, blockchain=${blockchain}`);
                const result = await executeTransaction(wallet.walletId, toAddress, amount, tokenAddress, blockchain);
                return NextResponse.json(result);
            }

            case 'getBalance': {
                const { blockchain } = params;
                const wallet = await getOrCreateWallet(actualUserId, blockchain);

                // Map blockchain to USDC token address (Official Circle Sandbox addresses)
                const usdcAddresses: Record<string, string> = {
                    'arcTestnet': '0x3600000000000000000000000000000000000000',
                    'ARC-TESTNET': '0x3600000000000000000000000000000000000000',
                    'ethereumSepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                    'ETH-SEPOLIA': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                    'baseSepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    'BASE-SEPOLIA': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    'arbitrumSepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
                    'ARB-SEPOLIA': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
                };

                const usdcAddress = usdcAddresses[blockchain] || usdcAddresses['arcTestnet'];

                // CRITICAL: On Arc Testnet, USDC is the NATIVE token (Gas token).
                // To get native balance, we must NOT pass a tokenAddress.
                const isArc = blockchain === 'arcTestnet' || blockchain === 'ARC-TESTNET';
                const balance = await getWalletBalance(wallet.walletId, isArc ? undefined : usdcAddress);

                console.log(`[API Balance] Fetching balance for ${blockchain} (Address: ${isArc ? 'NATIVE' : usdcAddress}). Result: ${balance}`);

                return NextResponse.json({
                    success: true,
                    balance: {
                        usdc: balance,
                        usdcDecimals: isArc ? 18 : 6
                    }
                });
            }

            case 'getAllBalances': {
                const { chains, tokenSymbol } = params;
                const { getOrCreateWallet } = await import('@/lib/serverWallet');
                const { getAllTokenBalances } = await import('@/lib/tokenDetection');

                // Get the main wallet address (should be the same across ARC and EVM chains for this user)
                const wallet = await getOrCreateWallet(actualUserId, 'arcTestnet');

                const tokenBalances = await getAllTokenBalances(
                    wallet.address,
                    chains || ['arcTestnet', 'ethereumSepolia', 'baseSepolia'],
                    tokenSymbol
                );

                return NextResponse.json({
                    success: true,
                    balances: tokenBalances
                });
            }

            case 'executeContractCall': {
                // CRITICAL: Get wallet by userId+blockchain, NOT trust walletId from client
                const { contractAddress, functionSignature, parameters, blockchain } = params;
                if (!blockchain) {
                    return NextResponse.json({ success: false, error: 'Missing blockchain parameter for executeContractCall' }, { status: 400 });
                }
                const wallet = await getOrCreateWallet(actualUserId, blockchain);
                console.log(`[executeContractCall] Using wallet ${wallet.walletId} for userId=${actualUserId}, blockchain=${blockchain}`);
                const result = await executeContractCall(
                    wallet.walletId,
                    contractAddress,
                    functionSignature,
                    parameters,
                    blockchain
                );
                return NextResponse.json(result);
            }

            case 'faucet': {
                const { blockchain, address } = params;
                let targetAddress = address;

                // If no address provided, use the user's wallet for that chain
                if (!targetAddress) {
                    const wallet = await getOrCreateWallet(actualUserId, blockchain);
                    targetAddress = wallet.address;
                }

                // Import dynamically to avoid circular deps if any
                const { requestTestnetTokens } = await import('@/lib/serverWallet');

                const result = await requestTestnetTokens(actualUserId, targetAddress, blockchain);
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[ServerWallet API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // Simple health check - NO wallet creation!
    // This endpoint should NEVER create wallets.
    return NextResponse.json({
        status: 'ok',
        message: 'Server wallet API is operational',
        warning: 'Use POST with userId to interact with wallets'
    });
}
