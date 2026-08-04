export class GameUI {
    constructor({ documentRef = document, windowRef = window } = {}) {
        this.document = documentRef;
        this.window = windowRef;
        this.onResume = null;
        this.pauseOverlay = null;
    }

    showPause(onResume) {
        this.onResume = onResume;
        const overlay = this.getOrCreatePauseOverlay();
        overlay.classList.remove('hidden');
    }

    hidePause() {
        this.pauseOverlay?.classList.add('hidden');
    }

    updateHud({ teamGems, teamScores, matchTimer, countdownActive, winCountdown }) {
        this.getElement('blue-gems').querySelector('.gem-count').textContent = teamGems.blue;
        this.getElement('red-gems').querySelector('.gem-count').textContent = teamGems.red;
        this.getElement('blue-score').querySelector('.score-count').textContent = teamScores.blue;
        this.getElement('red-score').querySelector('.score-count').textContent = teamScores.red;

        const minutes = Math.floor(matchTimer / 60);
        const seconds = Math.floor(matchTimer % 60);
        this.getElement('match-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.getElement('countdown-display').classList.toggle('hidden', !countdownActive);
        this.getElement('countdown-time').textContent = Math.max(0, Math.ceil(winCountdown));
    }

    showResult(winner, stats) {
        this.getElement('game-screen').classList.add('hidden');
        this.getElement('result-screen').classList.remove('hidden');

        const resultTitle = this.getElement('result-title');
        const presentation = this.getWinnerPresentation(winner);
        resultTitle.textContent = presentation.label;
        resultTitle.className = `result-title ${presentation.className}`;

        const starCount = this.calculateStarCount(stats);
        this.getElement('stars-container').querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('empty', index >= starCount);
        });

        this.getElement('result-stats').innerHTML = this.createResultMarkup(stats);
    }

    getWinnerPresentation(winner) {
        if (winner === 'draw') return { label: '🤝 DRAW!', className: 'draw' };
        if (winner) return { label: '🔵 BLUE TEAM WINS!', className: 'victory' };
        return { label: '🔴 RED TEAM WINS!', className: 'defeat' };
    }

    calculateStarCount(stats) {
        const margin = Math.abs(stats.blueGems - stats.redGems);
        return margin >= 5 ? 3 : margin >= 3 ? 2 : 1;
    }

    createResultMarkup(stats) {
        return `
            <div class="result-teams-container">
                ${this.createTeamResult('blue', 'BLUE TEAM', stats.blueGems)}
                <div class="matches-divider">VS</div>
                ${this.createTeamResult('red', 'RED TEAM', stats.redGems)}
            </div>
            <div class="score-summary">
                ${this.createScoreResult('blue', stats.blueScore)}
                ${this.createScoreResult('red', stats.redScore)}
            </div>
        `;
    }

    createTeamResult(team, title, gemCount) {
        return `
            <div class="result-team ${team}">
                <h3 class="team-title">${title}</h3>
                <div class="team-score-display">
                    <div class="gem-icon">💎</div>
                    <div class="gem-count">${gemCount}</div>
                </div>
            </div>
        `;
    }

    createScoreResult(team, score) {
        return `
            <div class="score-item ${team}">
                <span class="score-label">KILLS:</span>
                <span class="score-value">${score}</span>
            </div>
        `;
    }

    getOrCreatePauseOverlay() {
        if (this.pauseOverlay) return this.pauseOverlay;

        const overlay = this.document.createElement('div');
        overlay.id = 'pause-overlay';
        overlay.innerHTML = `
            <div class="pause-content" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                <h1 id="pause-title">⏸️ 일시정지</h1>
                <p>ESC 키를 눌러 게임을 재개하세요</p>
                <div class="pause-actions">
                    <button id="resume-btn" class="pause-btn" type="button">▶️ 게임 재개</button>
                    <button id="restart-btn" class="pause-btn restart" type="button">↻ 처음부터 다시</button>
                </div>
            </div>
        `;
        overlay.querySelector('#resume-btn').addEventListener('click', () => this.onResume?.());
        overlay.querySelector('#restart-btn').addEventListener('click', () => {
            this.window.dispatchEvent(new this.window.CustomEvent('restart-current-game'));
        });
        this.document.body.appendChild(overlay);
        this.pauseOverlay = overlay;
        return overlay;
    }

    cleanup() {
        this.pauseOverlay?.remove();
        this.pauseOverlay = null;
        this.onResume = null;
    }

    getElement(id) {
        const element = this.document.getElementById(id);
        if (!element) throw new Error(`Required game UI element not found: #${id}`);
        return element;
    }
}
