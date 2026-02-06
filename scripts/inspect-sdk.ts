
import dotenv from 'dotenv';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

dotenv.config({ path: '.env.local' });

async function check() {
    const client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    const search = ['createDeveloperTransactionContractExecution', 'createContractExecutionTransaction', 'createTransaction'];
    for (const s of search) {
        console.log(`Checking ${s}: ${typeof (client as any)[s]}`);
    }

    // Also look at the prototype
    console.log('Prototype keys:', Object.keys(Object.getPrototypeOf(client)));
}

check().catch(console.error);
