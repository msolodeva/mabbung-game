
import { renderSpikeField } from '../entities/brawlers/Spike.js';

export class RenderSystem {
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

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.updateCameraScale();
    }

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

        for (const gem of gameState.gems) {
            gem.render(this.ctx, this.camera);
        }

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
            brawler.render(this.ctx, this.camera, true);
        }

        gameState.effectsManager.render(this.ctx, this.camera);

        // Indicators use world coordinates, so keep them inside the translate/scale block
        this.renderPlayerIndicators(gameState);

        this.ctx.restore();
    }

    renderPlayerIndicators(gameState) {
        const renderIndicator = (player, label, color) => {
            if (!player || !player.isAlive) return;

            // In-world coordinates for text rendering
            const wx = player.position.x;
            const wy = player.position.y;

            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, wx, wy - player.radius - 45);
        };

        renderIndicator(gameState.player1, 'P1', '#4a90d9');
        renderIndicator(gameState.player2, 'P2', '#e74c3c');
    }

    cleanup() {
        window.removeEventListener('resize', this.handleResize);
    }
}
