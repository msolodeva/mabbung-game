import { traceRicochet } from '../utils/ricochet.js';

import { PROJECTILE_CONFIG, VISIBILITY_CONFIG } from '../utils/constants.js';
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

        this.shakeRemaining = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;

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

    triggerShake(intensity, durationMs) {
        if (intensity <= 0 || durationMs <= 0) return;
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, durationMs);
        this.shakeRemaining = Math.max(this.shakeRemaining, durationMs);
    }

    updateShake(deltaTime) {
        if (this.shakeRemaining <= 0) return;
        this.shakeRemaining = Math.max(0, this.shakeRemaining - Math.max(0, deltaTime) * 1000);
        if (this.shakeRemaining === 0) {
            this.shakeIntensity = 0;
            this.shakeDuration = 0;
        }
    }

    getShakeOffset(randomFn = Math.random) {
        if (this.shakeRemaining <= 0 || this.shakeDuration <= 0) {
            return { x: 0, y: 0 };
        }
        const decay = this.shakeRemaining / this.shakeDuration;
        const magnitude = this.shakeIntensity * decay;
        return {
            x: (randomFn() * 2 - 1) * magnitude,
            y: (randomFn() * 2 - 1) * magnitude,
        };
    }

    /**
     * 브롤러 특성에 맞는 조준 궤적/탄착 정보 계산
     */
    getAimPreview(player, gameState) {
        const heading = player.aimDirection.normalize();
        if (heading.magnitudeSquared() === 0) return null;

        if (player.config.maxBounces) {
            return {
                type: 'ricochet',
                points: traceRicochet(player.position, heading, player.attackRange, player.config.maxBounces, this.map),
                color: '#79f6ee',
            };
        }

        if (typeof player.getThrowRange === 'function') {
            const start = player.position.add(heading.multiply(18));
            const range = player.getThrowRange(heading, gameState, player.attackRange);
            const target = start.add(heading.multiply(range));
            return {
                type: 'lobbed',
                start,
                target,
                radius: player.config.explosionRadius || 90,
                color: player.config.color || '#f39c12',
            };
        }

        const startOffset = player.config.projectileSpawnDistance || (player.radius + 10);
        const start = player.position.add(heading.multiply(startOffset));
        let end = player.position.add(heading.multiply(player.attackRange));
        let blockedByWall = false;
        const step = PROJECTILE_CONFIG.COLLISION_STEP;

        if (this.map?.isPositionSolidForProjectile) {
            for (let dist = startOffset; dist <= player.attackRange; dist += step) {
                const probe = player.position.add(heading.multiply(dist));
                if (this.map.isPositionSolidForProjectile(probe.x, probe.y)) {
                    end = probe;
                    blockedByWall = true;
                    break;
                }
            }
        }

        return {
            type: 'line',
            start,
            end,
            endRadius: player.config.rocketExplosionRadius || 0,
            blockedByWall,
            piercing: player.config.id === 'rex',
            color: player.config.color || '#ffffff',
        };
    }

    renderAimPreview(player, gameState) {
        const preview = this.getAimPreview(player, gameState);
        if (!preview) return;

        const ctx = this.ctx;
        ctx.save();
        if (preview.type === 'ricochet') {
            ctx.strokeStyle = preview.color;
            ctx.globalAlpha = 0.65;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(preview.points[0].x, preview.points[0].y);
            for (const point of preview.points.slice(1)) ctx.lineTo(point.x, point.y);
            ctx.stroke();
        } else if (preview.type === 'lobbed') {
            ctx.strokeStyle = preview.color;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(preview.start.x, preview.start.y);
            ctx.lineTo(preview.target.x, preview.target.y);
            ctx.stroke();

            ctx.fillStyle = preview.color;
            ctx.globalAlpha = 0.16;
            ctx.beginPath();
            ctx.arc(preview.target.x, preview.target.y, preview.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.7;
            ctx.stroke();
        } else {
            ctx.strokeStyle = preview.piercing ? '#d2b4de' : '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = preview.piercing ? 4 : 3;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.moveTo(preview.start.x, preview.start.y);
            ctx.lineTo(preview.end.x, preview.end.y);
            ctx.stroke();

            if (preview.endRadius > 0) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = preview.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(preview.end.x, preview.end.y, preview.endRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
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

        // 1. Zoom and Center the whole map (with camera shake offset)
        const shake = this.getShakeOffset();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x + shake.x, -this.camera.y + shake.y);

        // 2. Render game elements
        this.map.render(this.ctx, this.camera);


        for (const field of gameState.spikeFields) {
            renderSpikeField(this.ctx, this.camera, field);
        }

        for (const projectile of gameState.projectiles) {
            projectile.render(this.ctx, this.camera);
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
            this.renderAimPreview(player, gameState);
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
