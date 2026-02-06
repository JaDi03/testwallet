import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

async function testTransferFormats() {
    const walletId = '0a019ef9-3e2d-5ce0-b50c-51ab9c623e6f'; // Your Base Sepolia wallet
    const toAddress = '0xF9F9cc8afEb56439B00b95C41Ea28c0EC49D5d87';
    const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

    console.log('🔍 Testing different amount formats with Circle SDK...\n');

    // Test 1: Decimal string
    console.log('Test 1: amount as decimal string array: ["0.1"]');
    try {
        const result = await client.estimateTransferFee({
            walletId,
            blockchain: 'BASE-SEPOLIA',
            tokenAddress: usdcAddress,
            destinationAddress: toAddress,
            amounts: ['0.1'], // Note: estimateTransferFee uses 'amounts' not 'amount'
        });
        console.log('✅ Decimal format accepted by SDK');
        console.log('Fee estimate:', result);
    } catch (e: any) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n---\n');

    // Test 2: Raw units string
    console.log('Test 2: amount as raw units string array: ["100000"]');
    try {
        const result = await client.estimateTransferFee({
            walletId,
            blockchain: 'BASE-SEPOLIA',
            tokenAddress: usdcAddress,
            destinationAddress: toAddress,
            amounts: ['100000'],
        });
        console.log('✅ Raw units format accepted by SDK');
        console.log('Fee estimate:', result);
    } catch (e: any) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n---\n');

    // Test 3: Check actual wallet balance
    console.log('Test 3: Checking actual wallet balance...');
    try {
        const balance = await client.getWalletTokenBalance({
            id: walletId,
            tokenAddress: usdcAddress,
        });
        console.log('Balance:', balance);
    } catch (e: any) {
        console.log('❌ Error:', e.message);
    }
}

testTransferFormats().catch(console.error);
