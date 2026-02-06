export type ToolResult = {
    success: boolean;
    message: string;
    data?: any;
    action?: string; // e.g., 'tx_link', 'faucet_card'
};

export interface AgentContext {
    userAddress: string;
    session?: any; // To be typed strictly with WalletSession
    userId?: string; // Dynamic user identifier for multi-user wallet support
}
