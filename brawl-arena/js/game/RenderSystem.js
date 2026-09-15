import { traceRicochet } from '../utils/ricochet.js';

import { VISIBILITY_CONFIG } from '../utils/constants.js';
import { renderSpikeField } from '../entities/brawlers/Spike.js';

/**
 * 렌더링 시스템 - 게임 로직과 렌더링 분리
 * Canvas 좌표 변환, 카메라 관리, 레이어별 렌더링 담당
 */
export class RenderSystem {
    /**
     * 렌더링 시스템 생성
     * @param {HTMLCanvasElement} canvas - 렌더링할 Canvas 엘리먼트
     * @param {GameMap} map - 게임 맵 (카메라 스케일 계산에 사용)
     */
    constructor(canvas, map) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.map = map;

        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height,
            zoom: 1
        };

        // Bind for event listener removal if needed
        this.handleResize = this.resizeCanvas.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Initial setup
        this.resizeCanvas();
    }

    /**
     * Canvas 크기 조정 (윈도우 리사이즈 시 호출)
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateCameraScale();
    }

    /**
     * 카메라 스케일 업데이트 - 전체 맵이 화면에 맞도록 조정
     */
    updateCameraScale() {
        if (!this.map || !this.camera) return;

        // Use the smaller scale to ensure the whole map fits
        const scaleX = this.canvas.width / this.map.width;
        const scaleY = this.canvas.height / this.map.height;
        this.camera.zoom = Math.min(scaleX, scaleY, 1);

        // Update camera dimensions in world coordinates
        this.camera.width = this.canvas.width / this.camera.zoom;
        this.camera.height = this.canvas.height / this.camera.zoom;

        // Center the camera on the map (world coordinates)
        this.camera.x = (this.map.width - this.camera.width) / 2;
        this.camera.y = (this.map.height - this.camera.height) / 2;
    }

    /**
     * 게임 전체 렌더링
     * @param {Game} gameState - 현재 게임 상태 (brawlers, projectiles 등 포함)
     */
    render(gameState) {
        // Clear canvas with background color
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // 1. Zoom and Center the whole map
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 2. Render game elements
        this.map.render(this.ctx, this.camera);


        for (const field of gameState.spikeFields) {
            renderSpikeField(this.ctx, this.camera, field);
        }

        for (const projectile of gameState.projectiles) {
            projectile.render(this.ctx, this.camera);
        }

        for (const bear of gameState.bears) {
            bear.render(this.ctx, this.camera);
        }

        const sortedBrawlers = [...gameState.brawlers].sort((a, b) => a.position.y - b.position.y);
        for (const brawler of sortedBrawlers) {
            if (brawler.isAlive && !brawler.isVisible) {
                this.renderConcealedBrawler(brawler);
            } else {
                brawler.render(this.ctx, this.camera, false);
            }
        }

        gameState.effectsManager.render(this.ctx, this.camera);

        // Indicators use world coordinates, so keep them inside the translate/scale block
        this.renderPlayerIndicators(gameState);
        for (const player of [gameState.player1, gameState.player2]) {
            if (!player?.isAlive || !player.isVisible || !player.isAimLocked) continue;
            if (player.config.maxBounces) {
                const points = traceRicochet(player.position, player.aimDirection, player.attackRange, player.config.maxBounces, this.map);
                this.ctx.save();
                this.ctx.strokeStyle = '#79f6ee';
                this.ctx.globalAlpha = 0.65;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([8, 6]);
                this.ctx.beginPath();
                this.ctx.moveTo(points[0].x, points[0].y);
                for (const point of points.slice(1)) this.ctx.lineTo(point.x, point.y);
                this.ctx.stroke();
                this.ctx.restore();
                continue;
            }
            const start = player.position.add(player.aimDirection.multiply(player.radius + 10));
            const end = player.position.add(player.aimDirection.multiply(100));
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([8, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    renderConcealedBrawler(brawler) {
        const ctx = this.ctx;
        const { x, y } = brawler.position;
        ctx.save();
        ctx.globalAlpha = VISIBILITY_CONFIG.CONCEALED_OPACITY;
        ctx.fillStyle = brawler.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, brawler.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = `bold ${brawler.radius * 1.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(brawler.config.emoji, x, y);
        ctx.restore();
    }

    renderPlayerIndicators(gameState) {
        const renderPremiumIndicator = (player, label, color) => {
            if (!player || !player.isAlive) return;
            ctx.save();
            ctx.globalAlpha = player.isVisible ? 1 : VISIBILITY_CONFIG.CONCEALED_OPACITY;

            const x = player.position.x;
            const y = player.position.y;

            // Modern Glassmorphism Tag (Below character for less clutter)
            const tagW = 100;
            const tagH = 30;
            const tagY = y + player.radius + 45;

            // Subtle Shadow
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';

            // Tag Background (Glass effect)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.roundRect(x - tagW / 2, tagY, tagW, tagH, 15);
            ctx.fill();

            ctx.shadowBlur = 0;

            // Highlight bar on top of tag
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x - tagW / 2, tagY, tagW, 6, { upperLeft: 15, upperRight: 15 });
            ctx.fill();

            // Label Text with better readability
            ctx.fillStyle = '#1a1a2e';
            ctx.font = '900 16px "Lilita One", "Nunito", Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, tagY + tagH / 2 + 2);
            ctx.restore();
        };

        const ctx = this.ctx;
        renderPremiumIndicator(gameState.player1, 'P1 PLAYER', '#4a90d9');
        const p2Color = gameState.player2 && gameState.player2.team === 'blue' ? '#4a90d9' : '#e74c3c';
        renderPremiumIndicator(gameState.player2, 'P2 PLAYER', p2Color);
    }

    cleanup() {
        window.removeEventListener('resize', this.handleResize);
    }
}
