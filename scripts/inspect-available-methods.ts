import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

console.log("\n🔍 Inspecting Circle SDK client methods...\n");
console.log("Available methods on client:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(m => !m.startsWith('_')));

console.log("\n\n🔍 Looking for transaction-related methods:");
const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
const txMethods = allMethods.filter(m =>
    m.toLowerCase().includes('transaction') ||
    m.toLowerCase().includes('transfer')
);
console.log(txMethods);

console.log("\n\n🔍 Looking for create methods:");
const createMethods = allMethods.filter(m => m.toLowerCase().includes('create'));
console.log(createMethods);
