# Agent Skill Integration Manual

## Overview
This Agent uses a modular architecture inspired by **OpenClaw**. Capabilities are organized as **Skills**, which are self-contained logic units that use **Adapters** to interact with blockchains or external APIs. This ensures the Agent is portable and not hard-coded to a specific UI or Framework.

## Directory Structure
```
src/agent/
├── workspace/           # The "Soul" & Config (Markdown)
│   ├── IDENTITY.md      # Persona definition
│   ├── INSTRUCTIONS.md  # core directives
│   └── TOOLS.md         # Docs for the LLM
├── skills/              # The "Hands" (TypeScript)
│   ├── core/            # Basic wallet functions (send, balance)
│   ├── defi/            # Financial logic (invest, swap, lp)
│   └── utility/         # Helpers (price fetcher)
├── runtime/             # The "Brain" (Engine)
│   └── runner.ts        # Main execution loop
└── adapters/            # Interfaces for portability
    ├── DEXAdapter.ts
    ├── WalletAdapter.ts
    └── SimulationAdapter.ts
```

## How to Create a New Skill

### Step 1: Define the Interface
Decide what your skill does. Example: `AddLiquidity`.
Inputs: `tokenA`, `tokenB`, `amount`.
Outputs: `execution_plan` (or transaction hash).

### Step 2: Implement the Logic in `src/agent/skills/<category>/`
Create `src/agent/skills/defi/addLiquidity.ts`.
**Critical Rule**: Do NOT import React components or UI libraries here. Use standard TS.

```typescript
import { ToolResult } from '../../types';
import { DEXAdapter } from '../../adapters/DEXAdapter';

export async function addLiquidity(params: any): Promise<ToolResult> {
  // 1. Validation
  // 2. Planning (Calculations)
  // 3. Execution via Adapter
}
```

### Step 3: Register the Tool
Update `src/agent/workspace/TOOLS.md` so the LLM knows it exists.
```markdown
## addLiquidity
Adds funds to a DeFi pool.
- params: { pool: string, amount: number }
```

### Step 4: Map to Runtime
Update `src/agent/runtime/runner.ts` (or the tool registry) to map the LLM's function call string `addLiquidity` to your TypeScript function.

## Best Practices
1.  **Use Adapters**: Never call `ethers.js` or `viem` directly inside the skill if possible. Use an Adapter so we can switch chains easily.
2.  **Return Data**: Always return a structured `ToolResult` { success, message, data }. The UI uses `data` to render widgets (like the Transaction Receipt card).
3.  **Error Handling**: Never crash. Catch all errors and return `{ success: false, message: "..." }`.
