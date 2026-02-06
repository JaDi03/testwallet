export interface PoolState {
    tokenA: string;
    tokenB: string;
    reservesA: string;
    reservesB: string;
    totalSupply: string;
}

export interface IDEXAdapter {
    getPool(tokenA: string, tokenB: string): Promise<string>; // returns pool address
    getPoolState(poolAddress: string): Promise<PoolState>;
    getQuote(amount: string, fromToken: string, toToken: string): Promise<string>; // returns output amount
    addLiquidity(
        poolAddress: string,
        amountA: string,
        amountB: string,
        minAmountA: string,
        minAmountB: string
    ): Promise<string>; // returns tx data
}
