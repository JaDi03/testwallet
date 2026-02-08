import {
    AgentSkill,
    BalanceSkill,
    TransferSkill,
    InvestSkillWrapper,
    LiquiditySkill,
    BridgeSkillWrapper,
    SwapSkillWrapper,
    QuoteSkillWrapper,
    FaucetSkill,
    ResumeBridgeSkillWrapper
} from './modules';

/**
 * The Central Registry of Agent Skills.
 * To add a new skill to the agent, simply add it to this list.
 */
export const SKILL_REGISTRY: AgentSkill[] = [
    new BalanceSkill(),
    new TransferSkill(),
    // new InvestSkillWrapper(),
    // new LiquiditySkill(),
    new BridgeSkillWrapper(),
    new ResumeBridgeSkillWrapper(),
    new SwapSkillWrapper(),
    new QuoteSkillWrapper(),
    new FaucetSkill()
];
