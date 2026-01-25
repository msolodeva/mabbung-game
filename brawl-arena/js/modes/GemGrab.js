// ========================================
// GEM GRAB - Game Mode
// ========================================

import { Gem } from '../entities/Gem.js';
import { Vector2 } from '../utils/Vector2.js';
import { GEM_CONFIG, GAME_CONFIG, TEAMS, GAME_STATES } from '../utils/constants.js';

export class GemGrabMode {
    constructor(game) {
        this.game = game;
        this.gems = [];
        this.teamGems = {
            [TEAMS.BLUE]: 0,
            [TEAMS.RED]: 0,
        };
        this.teamScores = {
            [TEAMS.BLUE]: 0,
            [TEAMS.RED]: 0,
        };

        this.gemSpawnTimer = 0;
        this.gemSpawnInterval = GEM_CONFIG.SPAWN_INTERVAL;

        this.winCountdown = 0;
        this.countdownActive = false;
        this.winningTeam = null;

        this.matchTime = GAME_CONFIG.MATCH_DURATION;
        this.matchTimer = this.matchTime;
    }

    update(deltaTime) {
        // Update match timer
        this.matchTimer -= deltaTime;
        if (this.matchTimer <= 0) {
            this.endMatch();
            return;
        }

        // Spawn gems
        this.gemSpawnTimer += deltaTime * 1000;
        if (this.gemSpawnTimer >= this.gemSpawnInterval) {
            this.gemSpawnTimer = 0;
            this.spawnGem();
        }

        // Update gems
        for (const gem of this.gems) {
            gem.update(deltaTime, this.game);
        }

        // Remove inactive gems
        this.gems = this.gems.filter(gem => gem.active);

        // Calculate team gems
        this.calculateTeamGems();

        // Check win condition
        this.checkWinCondition(deltaTime);

        // Update UI
        this.updateUI();
    }

    spawnGem() {
        const activeGems = this.gems.filter(g => g.active).length;
        if (activeGems >= GEM_CONFIG.MAX_GEMS_ON_FIELD) return;

        const spawnPos = this.game.map.getGemSpawnPosition();
        // Add some randomness
        const offset = Vector2.random(30);
        const gem = new Gem(spawnPos.x + offset.x, spawnPos.y + offset.y);
        this.gems.push(gem);
        this.game.gems.push(gem);
    }

    calculateTeamGems() {
        this.teamGems[TEAMS.BLUE] = 0;
        this.teamGems[TEAMS.RED] = 0;

        for (const brawler of this.game.brawlers) {
            if (brawler.isAlive) {
                this.teamGems[brawler.team] += brawler.gems;
            }
        }
    }

    checkWinCondition(deltaTime) {
        const blueGems = this.teamGems[TEAMS.BLUE];
        const redGems = this.teamGems[TEAMS.RED];

        // Check if a team has 10+ gems
        let leadingTeam = null;
        if (blueGems >= GAME_CONFIG.WIN_GEM_COUNT && blueGems > redGems) {
            leadingTeam = TEAMS.BLUE;
        } else if (redGems >= GAME_CONFIG.WIN_GEM_COUNT && redGems > blueGems) {
            leadingTeam = TEAMS.RED;
        }

        if (leadingTeam) {
            if (!this.countdownActive || this.winningTeam !== leadingTeam) {
                // Start/restart countdown
                this.countdownActive = true;
                this.winningTeam = leadingTeam;
                this.winCountdown = GAME_CONFIG.WIN_COUNTDOWN;
            } else {
                // Continue countdown
                this.winCountdown -= deltaTime;
                if (this.winCountdown <= 0) {
                    this.declareWinner(leadingTeam);
                }
            }
        } else {
            // No team has winning conditions
            this.countdownActive = false;
            this.winningTeam = null;
        }
    }

    declareWinner(team) {
        const isVictory = team === this.game.playerTeam;
        this.game.endGame(isVictory);
    }

    endMatch() {
        // Time's up - team with more KILLS (Score) wins
        // If scores are tied, then team with more gems wins
        const blueScore = this.teamScores[TEAMS.BLUE];
        const redScore = this.teamScores[TEAMS.RED];

        if (blueScore > redScore) {
            this.declareWinner(TEAMS.BLUE);
        } else if (redScore > blueScore) {
            this.declareWinner(TEAMS.RED);
        } else {
            // Scores are tied, fallback to gems
            const blueGems = this.teamGems[TEAMS.BLUE];
            const redGems = this.teamGems[TEAMS.RED];

            if (blueGems > redGems) {
                this.declareWinner(TEAMS.BLUE);
            } else if (redGems > blueGems) {
                this.declareWinner(TEAMS.RED);
            } else {
                // Total Tie
                this.game.endGame('draw');
            }
        }
    }

    onBrawlerDeath(brawler, game) {
        // Increment score for the opposing team
        if (brawler.team === TEAMS.BLUE) {
            this.teamScores[TEAMS.RED]++;
        } else {
            this.teamScores[TEAMS.BLUE]++;
        }

        // Gems are lost on death (not dropped)
        // brawler.gems was already cleared in brawler.die()
    }

    updateUI() {
        // Update gem counters
        const blueGemsEl = document.querySelector('#blue-gems .gem-count');
        const redGemsEl = document.querySelector('#red-gems .gem-count');

        if (blueGemsEl) blueGemsEl.textContent = this.teamGems[TEAMS.BLUE];
        if (redGemsEl) redGemsEl.textContent = this.teamGems[TEAMS.RED];

        // Update score counters
        const blueScoreEl = document.querySelector('#blue-score .score-count');
        const redScoreEl = document.querySelector('#red-score .score-count');

        if (blueScoreEl) blueScoreEl.textContent = this.teamScores[TEAMS.BLUE];
        if (redScoreEl) redScoreEl.textContent = this.teamScores[TEAMS.RED];

        // Update timer
        const timerEl = document.getElementById('match-timer');
        if (timerEl) {
            const minutes = Math.floor(this.matchTimer / 60);
            const seconds = Math.floor(this.matchTimer % 60);
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update countdown
        const countdownEl = document.getElementById('countdown-display');
        const countdownTimeEl = document.getElementById('countdown-time');

        if (countdownEl && countdownTimeEl) {
            if (this.countdownActive) {
                countdownEl.classList.remove('hidden');
                countdownTimeEl.textContent = Math.ceil(this.winCountdown);
            } else {
                countdownEl.classList.add('hidden');
            }
        }
    }

    getMatchStats() {
        return {
            blueGems: this.teamGems[TEAMS.BLUE],
            redGems: this.teamGems[TEAMS.RED],
            blueScore: this.teamScores[TEAMS.BLUE],
            redScore: this.teamScores[TEAMS.RED],
            matchTime: GAME_CONFIG.MATCH_DURATION - this.matchTimer,
        };
    }
}
