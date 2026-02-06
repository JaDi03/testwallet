
import { createPublicClient, http, decodeFunctionData, parseAbi } from 'viem';
import { arcTestnet } from '../src/lib/wallet-sdk';

const client = createPublicClient({ chain: arcTestnet, transport: http() });

async function main() {
    const txHash = '0x5bcaf52fe19e8794b13351272fbb5de0ea6f270d102a5ccd29e547c6de55195a';
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

    console.log('--- TRANSACTION INFO ---');
    console.log('To:', tx.to);
    console.log('Input:', tx.input);

    // We need to decode the execute call of the smart account
    // Selector for execute(address,uint256,bytes) is 0xb6148e38
    // Selector for executeBatch(address[],uint256[],bytes[]) is 0x47e1cd2a

    const abi = parseAbi([
        'function execute(address dest, uint256 value, bytes func)',
        'function executeBatch(address[] dest, uint256[] value, bytes[] func)'
    ]);

    try {
        const decoded = decodeFunctionData({ abi, data: tx.input });
        console.log('\n--- DECODED ACCOUNT CALL ---');
        console.log('Function:', decoded.functionName);
        console.log('Args:', JSON.stringify(decoded.args, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

        if (decoded.functionName === 'execute') {
            const innerData = (decoded.args as any)[2];
            console.log('\n--- INNER CALL DATA ---');
            console.log(innerData);
        } else if (decoded.functionName === 'executeBatch') {
            const innerDatas = (decoded.args as any)[2];
            innerDatas.forEach((data: string, i: number) => {
                console.log(`\n--- INNER CALL ${i} ---`);
                console.log(data);
            });
        }
    } catch (e: any) {
        console.log('Error decoding:', e.message);
    }
}
main();
