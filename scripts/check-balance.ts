import { getCircleClient, getOrCreateWallet, getWalletBalance } from '../src/lib/serverWallet';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBalance() {
    const userId = 'browser_7meabi1k0z'; // User ID from the logs
    const blockchain = 'baseSepolia'; // Chain we're checking
    const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

    console.log(`🔍 Checking balance for user ${userId} on ${blockchain}...\n`);

    const wallet = await getOrCreateWallet(userId, blockchain);
    console.log(`📍 Wallet ID: ${wallet.walletId}`);
    console.log(`📍 Address: ${wallet.address}\n`);

    const balance = await getWalletBalance(wallet.walletId, usdcAddress);
    console.log(`💰 USDC Balance: ${balance}`);
    console.log(`💰 Formatted: ${(parseFloat(balance) / 1e6).toFixed(6)} USDC`);
}

checkBalance().catch(console.error);
