import { BOT_TEAM_CONFIG as CONFIG } from '../utils/constants.js';

export function capabilities(config) {
    return [
        config.attackRange >= CONFIG.LONG_RANGE ? 'range' : null,
        CONFIG.CONTROL_IDS.includes(config.id) ? 'control' : null,
        CONFIG.RICOCHET_IDS.includes(config.id) ? 'ricochet' : null,
    ].filter(Boolean);
}

export function scoreTeamCandidate(config, members, random = Math.random) {
    const covered = new Set(members.flatMap(member => capabilities(member.config)));
    const missing = capabilities(config).filter(capability => !covered.has(capability)).length;
    const duplicates = members.filter(member => member.config.id === config.id).length;
    const sameRoles = members.filter(member => member.config.role === config.role).length;
    return missing * CONFIG.MISSING_CAPABILITY_BONUS
        - duplicates * CONFIG.DUPLICATE_PENALTY
        - sameRoles * CONFIG.SAME_ROLE_PENALTY
        + random() * CONFIG.RANDOM_VARIATION;
}
