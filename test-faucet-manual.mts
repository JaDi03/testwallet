
import { requestTestnetTokens } from './src/lib/serverWallet.ts';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing Faucet API...');

    // Test 1: Valid Request
    console.log('\n--- Request 1 ---');
    const res1 = await requestTestnetTokens(
        'test-user-1',
        '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Valid address
        'ETH-SEPOLIA'
    );
    console.log('Res 1:', res1);

    // Test 2: Rate Limit (Should Fail)
    console.log('\n--- Request 2 (Should Rate Limit) ---');
    const res2 = await requestTestnetTokens(
        'test-user-1',
        '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        'ETH-SEPOLIA'
    );
    console.log('Res 2:', res2);

    // Test 3: New User (Should Succeed)
    console.log('\n--- Request 3 (New User) ---');
    const res3 = await requestTestnetTokens(
        'test-user-2',
        '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        'ETH-SEPOLIA'
    );
    console.log('Res 3:', res3);
}

test();
