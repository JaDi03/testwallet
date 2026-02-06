
import { createPublicClient, http, parseAbi, keccak256, toBytes } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const client = createPublicClient({ chain: arcTestnet, transport: http() });

const ADDR_V2_MESSENGER = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const ADDR_V1_MESSENGER = '0x8c9d55F8E537Ad7dd89f29d1d1338Ac45B6b37c6';

function getSelector(sig: string) {
    return keccak256(toBytes(sig)).slice(0, 10);
}

async function main() {
    console.log('--- SELECTORS ---');
    console.log('depositForBurn:', getSelector('depositForBurn(uint256,uint32,bytes32,address)'));
    console.log('depositForBurnWithCaller:', getSelector('depositForBurnWithCaller(uint256,uint32,bytes32,address,bytes32)'));
    console.log('burn:', getSelector('burn(uint256,uint32,bytes32,address)'));

    for (const addr of [ADDR_V1_MESSENGER, ADDR_V2_MESSENGER]) {
        console.log(`\n--- Checking ${addr} ---`);
        try {
            const domain = await client.readContract({
                address: addr as `0x${string}`,
                abi: parseAbi(['function localDomain() view returns (uint32)']),
                functionName: 'localDomain'
            });
            console.log('Local Domain:', domain);
        } catch (e: any) {
            console.log('localDomain Error:', e.message.slice(0, 100));
        }
    }
}
main();
