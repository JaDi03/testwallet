
import dotenv from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

dotenv.config({ path: '.env.local' });

async function listAll() {
    const client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    console.log("🔍 Listing all wallets in the developer account...\n");

    try {
        const { data: setsData } = await client.listWalletSets({});
        for (const set of setsData?.walletSets || []) {
            console.log(`📂 Wallet Set: ${set.name} (${set.id}) [${set.custodyType}]`);

            const { data: walletsData } = await client.listWallets({ walletSetId: set.id! });
            if (!walletsData?.wallets?.length) {
                console.log("   (empty)");
                continue;
            }

            for (const w of walletsData.wallets) {
                console.log(`   📍 [${w.blockchain}] ${w.address}`);
                console.log(`      ID: ${w.id} | Ref: ${w.refId} | Name: ${w.name}`);
            }
        }
    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

listAll().catch(console.error);
