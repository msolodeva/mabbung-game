import { GAME_CONFIG, TEAMS } from '../utils/constants.js';

export class TeamDeathmatchMode {
    constructor(game) {
        this.game = game;
        this.teamScores = { [TEAMS.BLUE]: 0, [TEAMS.RED]: 0 };
        this.matchTime = GAME_CONFIG.MATCH_DURATION;
        this.matchTimer = this.matchTime;
        this.ended = false;
    }

    update(deltaTime) {
        if (this.ended) return;
        this.matchTimer = Math.max(0, this.matchTimer - Math.max(0, deltaTime));
        this.game.ui?.updateHud({ teamScores: this.teamScores, matchTimer: this.matchTimer });
        if (this.matchTimer === 0) this.endMatch();
    }

    onBrawlerDeath(brawler) {
        if (this.ended) return;
        const scoringTeam = brawler.team === TEAMS.BLUE ? TEAMS.RED : TEAMS.BLUE;
        this.teamScores[scoringTeam]++;
    }

    endMatch() {
        if (this.ended) return;
        this.ended = true;
        const { blue, red } = this.teamScores;
        const winner = blue > red ? TEAMS.BLUE : TEAMS.RED;
        this.game.endGame(blue === red ? 'draw' : winner === this.game.playerTeam);
    }

    getMatchStats() {
        return {
            blueScore: this.teamScores[TEAMS.BLUE],
            redScore: this.teamScores[TEAMS.RED],
            matchTime: this.matchTime - this.matchTimer,
        };
    }
}
