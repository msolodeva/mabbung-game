export class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onLoadComplete = null;
    }

    load(assets) {
        this.totalCount = Object.keys(assets).length;
        if (this.totalCount === 0 && this.onLoadComplete) {
            this.onLoadComplete();
            return;
        }

        for (const [key, src] of Object.entries(assets)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                // Process the image to remove white background
                const processed = this.removeWhiteBackground(img);
                this.images[key] = processed;

                this.loadedCount++;
                if (this.loadedCount === this.totalCount && this.onLoadComplete) {
                    this.onLoadComplete();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load asset: ${key} at ${src}`);
                this.loadedCount++;
                if (this.loadedCount === this.totalCount && this.onLoadComplete) {
                    this.onLoadComplete();
                }
            };
        }
    }

    removeWhiteBackground(img) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const width = tempCanvas.width;
        const height = tempCanvas.height;



        // Flood Fill Algorithm to remove background
        // seed from all borders to catch disjoint background regions
        const stack = [];
        const processed = new Uint8Array(width * height); // keep track of visited

        // Function to check if pixel matches background color (white-ish)
        const isMatch = (x, y) => {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // Threshold for white
            return a !== 0 && r > 200 && g > 200 && b > 200;
        };

        // Function to clear pixel
        const clearPixel = (x, y) => {
            const idx = (y * width + x) * 4;
            data[idx + 3] = 0; // Alpha 0
        };

        // Seed with all border pixels that match background
        for (let x = 0; x < width; x++) {
            if (isMatch(x, 0)) stack.push([x, 0]);
            if (isMatch(x, height - 1)) stack.push([x, height - 1]);
        }
        for (let y = 0; y < height; y++) {
            if (isMatch(0, y)) stack.push([0, y]);
            if (isMatch(width - 1, y)) stack.push([width - 1, y]);
        }

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = y * width + x;

            if (processed[idx]) continue;
            processed[idx] = 1;

            if (isMatch(x, y)) {
                clearPixel(x, y);

                // Add neighbors
                if (x > 0) stack.push([x - 1, y]);
                if (x < width - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < height - 1) stack.push([x, y + 1]);
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return tempCanvas;
    }

    get(key) {
        return this.images[key];
    }

    createColorVariant(image, hueShift) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');

        // Draw original
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 0) {
                // Check if this pixel is part of the "red" outfit
                // Simple heuristic: Red is dominant
                if (r > g + 20 && r > b + 20) {
                    // Check if it's the specific red shade we want to shift
                    // Convert RGB to HSL
                    const [h, s, l] = this.rgbToHsl(r, g, b);

                    // Shift Hue
                    const newH = (h + hueShift) % 1;

                    // Convert back to RGB
                    const [newR, newG, newB] = this.hslToRgb(newH, s, l);

                    data[i] = newR;
                    data[i + 1] = newG;
                    data[i + 2] = newB;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}
