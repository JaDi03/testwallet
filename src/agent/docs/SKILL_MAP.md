# Skill Map — Smart Agent Wallet V1

## Overview
This document outlines the architectural layers of the Agent. We build skills layer by layer, starting from Core reasoning up to specialized DeFi and UX capabilities.

## 🧩 CAPA 1 — Core Agent Skills (The Brain)
*Non-blockchain logic. Controls reasoning and orchestration.*

1.  **Intent Parsing Skill**: Interpret natural language, detect action/asset/chain/amount.
2.  **Planning Skill**: Convert intent into a multi-step execution graph (dependency ordering).
3.  **Context Builder Skill**: Gather balances, approvals, and user state.
4.  **Policy & Risk Evaluation Skill**: Validate against allowlists, limits, and risk scores.
5.  **Simulation Skill**: Pre-execute transactions to estimate gas/slippage/outcome.
6.  **Confirmation Orchestration Skill**: Generate human-readable summaries and handle approval flow.

## 👛 CAPA 2 — Wallet Skills
7.  **Wallet Creation Skill**: Deploy multi-chain smart accounts.
8.  **Balance & Portfolio Skill**: Cross-chain consolidation of assets.
9.  **Identity Resolution Skill**: Map `@handles` to addresses.

## 💸 CAPA 3 — Transfer Skills
10. **Token Transfer Skill**: Basic ERC20/Native transfers.
11. **Smart Send Skill**: Send by alias/name with fallback.
12. **Approval Management Skill**: Check/Add/Revoke allowances.

## 🌉 CAPA 4 — Cross-Chain Skills
13. **CCTP Bridge Skill**: USDC native bridging (Circle).
14. **Chain Selection Skill**: Auto-detect destination networks.

## 🔄 CAPA 5 — Swap & Conversion Skills
15. **Token Swap Skill**: Quote and execute swaps (Uniswap/ArcSwap).
16. **Auto-Balance Skill**: Partial swaps for LP provision ratios.

## 🏦 CAPA 6 — DeFi Skills
17. **Yield Vault Deposit Skill**: Deposit into specific strategies.
18. **Yield Withdraw Skill**: Exit positions.
19. **Liquidity Add Skill**: (Composite) Calc ratio -> Approve -> Mint LP.
20. **Liquidity Remove Skill**: Burn LP -> Receive tokens.
21. **Pool Discovery Skill**: Find best APY/TVL pools.

## ⛽ CAPA 7 — Gas & Sponsor Skills
22. **Gas Estimation Skill**: Predict costs.
23. **Gas Sponsor Skill**: Apply Paymaster logic (Gas Station).

## 🛡️ CAPA 8 — Security & Control (Guardrails)
24. **Limit Enforcement Skill**: Daily/Tx caps.
25. **Protocol Allowlist Skill**: Safety check for contracts.
26. **Risk Scoring Skill**: Evaluate transaction danger level.

## 🧾 CAPA 9 — State & Memory
27. **Position Tracking Skill**: DB logging of active LPs/Vaults.
28. **Execution Logging Skill**: Audit trail of plans and results.
29. **User Preference Skill**: Risk tolerance settings.

## 🧪 CAPA 10 — UX Agent Skills
30. **Explanation Skill**: Translate tx hashes to "You sent money".
31. **Suggestion Skill**: "You have idle USDC, want to yield?"
32. **Error Recovery Skill**: "Tx failed, trying with higher gas?"

---

## 🎯 V1 Minimal Scope (Target)
The strict set of skills we are building first:

-   [ ] Intent Parsing
-   [ ] Planning
-   [ ] Policy Check
-   [ ] Simulation
-   [ ] Confirmation
-   [x] Wallet Creation (Done)
-   [x] Balance (Done)
-   [ ] Identity Resolution
-   [x] Token Transfer (Basic Done)
-   [ ] Smart Send
-   [ ] Approval Management
-   [ ] CCTP Bridge
-   [ ] Chain Selection
-   [ ] Yield Deposit (Simulated)
-   [ ] Liquidity Add
-   [x] Gas Sponsor (Done via Config)
-   [ ] Limit Enforcement
-   [ ] Risk Score
-   [ ] Execution Logging
-   [ ] Explanation
-   [ ] Error Recovery
