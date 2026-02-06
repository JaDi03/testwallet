import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

async function testTransfer() {
    // Wallet for browser_7meabi1k0z on Base Sepolia
    const walletId = '04015570-441d-5954-9a2f-03723e342bde';
    const toAddress = '0xF9F9cc8afEb56439B00b95C41Ea28c0EC49D5d87';
    const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const blockchain = 'BASE-SEPOLIA';

    console.log('🔍 Step 1: Checking wallet balance first...\n');

    try {
        const balanceResp = await client.getWalletTokenBalance({
            id: walletId,
            tokenAddress: usdcAddress,
        });
        console.log('Balance response:', JSON.stringify(balanceResp, null, 2));
    } catch (e: any) {
        console.log('Balance check error:', e.message);
    }

    console.log('\n---\n');
    console.log('🔍 Step 2: Testing transfer with decimal format ["0.1"]...\n');

    const txParams = {
        walletId,
        blockchain,
        tokenAddress: usdcAddress,
        destinationAddress: toAddress,
        amount: ['0.1'],
        fee: {
            type: 'level',
            config: {
                feeLevel: 'MEDIUM'
            }
        },
        idempotencyKey: uuidv4(),
    };

    console.log('Transaction params:', JSON.stringify(txParams, null, 2));
    console.log('\n');

    try {
        const result = await (client as any).createTransaction(txParams);
        console.log('✅ SUCCESS! Transaction created:');
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.log('❌ ERROR:', e.message);
        console.log('\nFull error details:');
        console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
}

testTransfer().catch(console.error);
