
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';

const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc-testnet.arc.circle.com'] },
        public: { http: ['https://rpc-testnet.arc.circle.com'] },
    }
});

async function check() {
    const client = createPublicClient({
        chain: arcTestnet,
        transport: http()
    });

    const addresses = {
        usdc: "0x3600000000000000000000000000000000000000",
        messenger: "0x3a00000000000000000000000000000000000000"
    };

    for (const [name, addr] of Object.entries(addresses)) {
        const code = await client.getBytecode({ address: addr as `0x${string}` });
        console.log(`${name} (${addr}): ${code ? 'CONTRACT (' + code.length + ' bytes)' : 'NO CODE'}`);
    }
}

check().catch(console.error);
