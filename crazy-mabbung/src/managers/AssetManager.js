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
}
