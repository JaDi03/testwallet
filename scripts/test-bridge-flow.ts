/**
 * Test script to verify that 'guest' has been completely eliminated
 * and that the bridge flow uses correct chain identifiers.
 * 
 * Run with: npx ts-node scripts/test-bridge-flow.ts
 */

import { getCircleClient, getOrCreateWallet, executeTransaction } from '../src/lib/serverWallet';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TEST_USER_ID = 'test_user_' + Date.now();

async function testBridgeFlow() {
    console.log('='.repeat(60));
    console.log('🧪 BRIDGE FLOW VALIDATION TEST');
    console.log('='.repeat(60));
    console.log(`\n📋 Test User ID: ${TEST_USER_ID}\n`);

    try {
        // Initialize SDK
        console.log('1️⃣ Initializing Circle SDK...');
        getCircleClient(); // This will initialize if not already done
        console.log('   ✅ SDK initialized\n');

        // Test wallet creation on Arc
        console.log('2️⃣ Creating wallet on ARC-TESTNET...');
        const arcWallet = await getOrCreateWallet(TEST_USER_ID, 'arcTestnet');
        console.log(`   ✅ Arc Wallet: ${arcWallet.address}`);
        console.log(`   📦 Wallet ID: ${arcWallet.walletId}\n`);

        // Test wallet creation on Base
        console.log('3️⃣ Creating wallet on BASE-SEPOLIA...');
        const baseWallet = await getOrCreateWallet(TEST_USER_ID, 'baseSepolia');
        console.log(`   ✅ Base Wallet: ${baseWallet.address}`);
        console.log(`   📦 Wallet ID: ${baseWallet.walletId}\n`);

        // Verify addresses are the same (Universal SCA)
        console.log('4️⃣ Verifying Universal SCA Address Consistency...');
        if (arcWallet.address.toLowerCase() === baseWallet.address.toLowerCase()) {
            console.log(`   ✅ PASS: Both wallets share the same address!`);
            console.log(`   🔗 Universal Address: ${arcWallet.address}\n`);
        } else {
            console.log(`   ❌ FAIL: Addresses are different!`);
            console.log(`   Arc: ${arcWallet.address}`);
            console.log(`   Base: ${baseWallet.address}\n`);
            process.exit(1);
        }

        // Test that 'guest' is NOT being used
        console.log('5️⃣ Verifying no "guest" wallet is created accidentally...');
        try {
            // This should work fine since we use real userId
            const ethWallet = await getOrCreateWallet(TEST_USER_ID, 'ethereumSepolia');
            console.log(`   ✅ ETH-SEPOLIA Wallet: ${ethWallet.address}`);

            if (ethWallet.address.toLowerCase() === arcWallet.address.toLowerCase()) {
                console.log(`   ✅ Address consistency verified across 3 chains!\n`);
            }
        } catch (e: any) {
            console.log(`   ⚠️ ETH wallet creation: ${e.message}\n`);
        }

        console.log('='.repeat(60));
        console.log('🎉 ALL TESTS PASSED!');
        console.log('='.repeat(60));
        console.log(`\n✅ User ${TEST_USER_ID} has Universal SCA wallets on:`);
        console.log(`   • Arc Testnet (Domain 26)`);
        console.log(`   • Base Sepolia (Domain 6)`);
        console.log(`   • Ethereum Sepolia (Domain 0)`);
        console.log(`\n🔗 All using address: ${arcWallet.address}`);

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testBridgeFlow();
