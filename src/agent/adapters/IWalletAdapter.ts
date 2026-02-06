import { ToolResult } from "../types";

export interface IWalletAdapter {
    getBalance(address: string): Promise<string>;
    sendTransaction(to: string, amount: string, data?: string): Promise<string>; // returns hash
}
