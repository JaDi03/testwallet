# Skill Map — Smart Agent Wallet V1

Sistema modular de skills para el agente autónomo de wallet. Organizado en 10 capas funcionales.

## 🧩 CAPA 1 — Core Agent Skills (Cerebro)

Estas no tocan blockchain — controlan el razonamiento.

### 1️⃣ Intent Parsing Skill
- Interpretar lenguaje natural
- Detectar acción, activos, destino, chain, monto
- Marcar ambigüedad

### 2️⃣ Planning Skill
- Convertir intent → plan multi-paso
- Ordenar dependencias
- Insertar bridge/swap si necesario
- Generar execution graph

### 3️⃣ Context Builder Skill
- Reunir balances, wallets por red, approvals
- Policies, estado usuario

### 4️⃣ Policy & Risk Evaluation Skill
- Validar contra límites, allowlists, caps
- Sponsor budget, riesgo acción
- Decidir: permitir / pedir confirmación / bloquear

### 5️⃣ Simulation Skill
- Simular transacciones
- Estimar resultados, gas, slippage
- Producir preview

### 6️⃣ Confirmation Orchestration Skill
- Generar resumen entendible
- Pedir confirmación, manejar cancelaciones
- Re-plan si usuario cambia params

---

## 👛 CAPA 2 — Wallet Skills

### 7️⃣ Wallet Creation Skill
- Crear wallet controlada/multi-chain
- Asignar policies, registrar identidad

### 8️⃣ Balance & Portfolio Skill
- Consultar balances
- Consolidar cross-chain
- Mostrar portfolio simple

### 9️⃣ Identity Resolution Skill
- Resolver @handle → wallet
- Crear wallet si no existe
- Mapear usuario ↔ wallet set

---

## 💸 CAPA 3 — Transfer Skills

### 🔟 Token Transfer Skill
- Enviar tokens
- Detectar chain destino
- Verificar balances, ejecutar transfer

### 1️⃣1️⃣ Smart Send Skill
- Enviar por handle/alias/nombre
- Fallback a dirección

### 1️⃣2️⃣ Approval Management Skill
- Verificar allowance
- Aprobar tokens
- Minimizar approvals, revocar (futuro)

---

## 🌉 CAPA 4 — Cross-Chain Skills

### 1️⃣3️⃣ CCTP Bridge Skill ✅ **IMPLEMENTADO**
- Mover USDC cross-chain
- Seleccionar ruta
- Ejecutar bridge, verificar llegada

### 1️⃣4️⃣ Chain Selection Skill
- Decidir mejor red destino
- Detectar red pool/protocolo
- Insertar bridge automático

---

## 🔄 CAPA 5 — Swap & Conversion Skills

### 1️⃣5️⃣ Token Swap Skill ✅ **IMPLEMENTADO**
- Cotizar swap, simular, ejecutar
- Slippage control
- Uniswap V2 integration
- Autonomous execution

### 1️⃣6️⃣ Auto-Balance Skill
- Balancear tokens para LP
- Swap parcial automático

---

## 🏦 CAPA 6 — DeFi Skills

### 1️⃣7️⃣ Yield Vault Deposit Skill
- Listar vaults allowlist
- Rank APY/riesgo
- Depositar, trackear posición

### 1️⃣8️⃣ Yield Withdraw Skill
- Retirar vault
- Calcular retorno, cerrar posición

### 1️⃣9️⃣ Liquidity Add Skill ✅ **DISEÑADO**
- Agregar liquidez
- Calcular proporción, approvals, mint LP

### 2️⃣0️⃣ Liquidity Remove Skill
- Remover liquidez
- Quemar LP, recibir tokens

### 2️⃣1️⃣ Pool Discovery Skill
- Listar pools válidas
- Filtrar por tokens, rank riesgo/TVL

---

## ⛽ CAPA 7 — Gas & Sponsor Skills

### 2️⃣2️⃣ Gas Estimation Skill
- Estimar gas
- Estimar sponsor usage

### 2️⃣3️⃣ Gas Sponsor Skill
- Solicitar sponsor
- Validar budget, aplicar límites

---

## 🛡️ CAPA 8 — Seguridad & Control

### 2️⃣4️⃣ Limit Enforcement Skill
- Límites por tx, diarios
- Caps por protocolo

### 2️⃣5️⃣ Protocol Allowlist Skill
- Validar protocolo permitido
- Validar pool permitida

### 2️⃣6️⃣ Risk Scoring Skill
- Score de riesgo acción
- Marcar advertencias

---

## 🧾 CAPA 9 — Estado & Memoria

### 2️⃣7️⃣ Position Tracking Skill
- Registrar LP, vaults, yield

### 2️⃣8️⃣ Execution Logging Skill
- Guardar planes, tx, resultados

### 2️⃣9️⃣ User Preference Skill
- Recordar preferencias
- Recordar tolerancia riesgo

---

## 🧪 CAPA 10 — UX Agent Skills

### 3️⃣0️⃣ Explanation Skill
- Explicar acción simple
- Explicar riesgo, resultado

### 3️⃣1️⃣ Suggestion Skill
- Sugerir yield, acciones, optimización

### 3️⃣2️⃣ Error Recovery Skill
- Interpretar fallos
- Re-plan, proponer alternativa

---

## 🎯 V1 Mínima Viable (21 Skills)

Para no inflar scope — skills estrictamente necesarias:

**Core (6):**
1. Intent Parsing
2. Planning
3. Policy
4. Simulation
5. Confirmation
6. Error Recovery

**Wallet (3):**
7. Wallet Creation
8. Balance
9. Identity Resolution

**Transfer (3):**
10. Token Transfer
11. Smart Send
12. Approval

**Cross-Chain (2):**
13. CCTP Bridge ✅
14. Chain Selection

**DeFi (2):**
15. Yield Deposit
16. Liquidity Add

**Gas (1):**
17. Gas Sponsor

**Security (2):**
18. Limit Enforcement
19. Risk Score

**State (2):**
20. Execution Logging
21. Explanation

---

## Estado Actual

### ✅ Implementado
- **CCTP Bridge Skill** - Bridge USDC entre Arc Testnet ↔ Base Sepolia ↔ Ethereum Sepolia
- **Wallet Creation** - Circle Developer Controlled Wallets (SCA)
- **Token Transfer** - Transferencias básicas
- **Balance** - Consulta de balances

### 🚧 En Progreso
- **Intent Parsing** - Parsing básico en `engine.ts`
- **Planning** - Lógica simple en `engine.ts`

### 📋 Pendiente
- Resto de skills según prioridad V1

---

## Arquitectura de Skills

Cada skill debe seguir esta estructura:

```typescript
export const SkillName = {
    name: "skill_name",
    description: "What this skill does",
    
    async execute(context: AgentContext, params: SkillParams): Promise<SkillResult> {
        // 1. Validate inputs
        // 2. Execute logic
        // 3. Return structured result
    }
}
```

### Ubicación
```
src/agent/skills/
├── core/           # Skills de razonamiento
├── cross-chain/    # Bridge & chain selection
├── defi/           # Yield, LP, swaps
├── security/       # Risk, limits, allowlists
└── ux/             # Explanation, suggestions
```
