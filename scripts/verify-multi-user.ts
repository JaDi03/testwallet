/**
 * Verification Script: Multi-User Wallet Creation
 * Tests that different userIds result in unique, deterministic SCA addresses
 */

import { getOrCreateWallet } from '../src/lib/serverWallet';

async function verifyMultiUserWallets() {
    console.log("🧪 Testing Multi-User Wallet Creation\n");

    const testUsers = [
        'tg_123456789',
        'tg_987654321',
        'dev_user_001',
        'tg_111222333'
    ];

    const walletMap: Record<string, { address: string; walletId: string }> = {};

    for (const userId of testUsers) {
        console.log(`\n📝 Creating wallet for: ${userId}`);

        try {
            const wallet = await getOrCreateWallet(userId, 'arcTestnet');
            walletMap[userId] = {
                address: wallet.address,
                walletId: wallet.walletId
            };

            console.log(`   ✅ Address: ${wallet.address}`);
            console.log(`   📋 Wallet ID: ${wallet.walletId}`);
            console.log(`   🔐 Type: ${wallet.accountType}`);
        } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    // Verify uniqueness
    console.log("\n\n🔍 Verifying Uniqueness:");
    const addresses = Object.values(walletMap).map(w => w.address);
    const uniqueAddresses = new Set(addresses);

    if (addresses.length === uniqueAddresses.size) {
        console.log("✅ All wallets have unique addresses!");
    } else {
        console.error("❌ DUPLICATE ADDRESSES DETECTED!");
    }

    // Verify determinism (create again and check)
    console.log("\n\n🔁 Verifying Determinism (Re-creating first user):");
    const firstUser = testUsers[0];
    const recreated = await getOrCreateWallet(firstUser, 'arcTestnet');

    if (recreated.address === walletMap[firstUser].address) {
        console.log(`✅ ${firstUser} address is deterministic: ${recreated.address}`);
    } else {
        console.error(`❌ Address mismatch for ${firstUser}!`);
        console.error(`   Original: ${walletMap[firstUser].address}`);
        console.error(`   Recreated: ${recreated.address}`);
    }

    console.log("\n✨ Verification Complete!\n");
}

verifyMultiUserWallets().catch(console.error);
