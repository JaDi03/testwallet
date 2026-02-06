# Smart Agent Wallet

Telegram Mini App con agente autónomo para operaciones DeFi cross-chain.

## 🎯 Características

- **Agente Autónomo**: Interpreta lenguaje natural y ejecuta operaciones complejas
- **Cross-Chain Bridge**: USDC via CCTP entre Arc Testnet, Base Sepolia, Ethereum Sepolia
- **Smart Wallets**: Circle Developer Controlled Wallets (SCA) con gas sponsoring
- **Multi-Chain**: Soporte para múltiples redes desde una sola interfaz
- **Telegram Native**: Integración completa con Telegram Mini Apps

## 🏗️ Arquitectura

```
src/
├── agent/              # Core agent logic
│   ├── skills/         # Modular skill system
│   │   ├── core/       # Wallet operations
│   │   ├── cross-chain/# CCTP bridge
│   │   └── defi/       # DeFi integrations
│   ├── engine.ts       # Agent reasoning engine
│   └── docs/           # Skill documentation
├── app/                # Next.js app
├── components/         # React components
└── lib/                # SDK wrappers
```

## 🚀 Estado Actual

### ✅ Implementado
- CCTP Bridge (Arc ↔ Base ↔ Ethereum)
- Wallet Creation (Circle SCA)
- Token Transfers
- Balance Queries
- Intent Parsing básico

### 📋 Roadmap
Ver [ROADMAP.md](src/agent/docs/ROADMAP.md) para el plan completo de 32 skills.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Wallet**: Circle Programmable Wallets SDK
- **Bridge**: Circle CCTP
- **Agent**: Custom skill-based architecture
- **Deployment**: Vercel

## 📦 Instalación

```bash
npm install
```

## 🔧 Configuración

Crear `.env.local`:

```env
# Circle API
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret

# Next.js
NEXT_PUBLIC_CLIENT_KEY=your_client_key
NEXT_PUBLIC_CLIENT_URL=your_client_url

# Telegram (opcional)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
```

## 🏃 Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📚 Documentación

- [Skill Map](src/agent/docs/SKILL_MAP.md) - Documentación de skills
- [ROADMAP](src/agent/docs/ROADMAP.md) - Plan de desarrollo
- [Integration Manual](src/agent/docs/SKILL_INTEGRATION_MANUAL.md) - Guía de integración

## 🧪 Testing

```bash
# Verificar bridge
npm run test:bridge

# Verificar wallets
npm run test:wallets
```

## 🤝 Contribuir

Este es un proyecto en desarrollo activo. Ver [ROADMAP.md](src/agent/docs/ROADMAP.md) para áreas de contribución.

## 📄 Licencia

MIT

---

**Nota**: Este proyecto está en fase de desarrollo. No usar en producción con fondos reales.
