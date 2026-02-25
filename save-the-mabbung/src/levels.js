/**
 * Level definitions for Save the Mabbung.
 * Each level defines the character position, beehive(s), obstacles, ink, and bee count.
 */
export const levels = [
    // Level 1: Simple - one beehive above, open area
    {
        name: 'Level 1',
        character: { x: 400, y: 450 },
        beehives: [
            { x: 400, y: 80 }
        ],
        obstacles: [
            // Ground
            { type: 'rect', x: 400, y: 590, w: 800, h: 40, isGround: true }
        ],
        inkAmount: 600,
        maxBees: 15,
        timer: 10
    },
    // Level 2: Two beehives on sides
    {
        name: 'Level 2',
        character: { x: 400, y: 400 },
        beehives: [
            { x: 100, y: 100 },
            { x: 700, y: 100 }
        ],
        obstacles: [
            // Ground
            { type: 'rect', x: 400, y: 590, w: 800, h: 40, isGround: true },
            // Platform under character
            { type: 'rect', x: 400, y: 450, w: 150, h: 20 }
        ],
        inkAmount: 550,
        maxBees: 20,
        timer: 10
    },
    // Level 3: Character on cliff edge, beehive to the side
    {
        name: 'Level 3',
        character: { x: 650, y: 400 },
        beehives: [
            { x: 150, y: 80 },
            { x: 400, y: 80 }
        ],
        obstacles: [
            // Ground (partial - cliff)
            { type: 'rect', x: 600, y: 460, w: 400, h: 30 },
            // Cliff wall
            { type: 'rect', x: 400, y: 520, w: 20, h: 150 },
            // Bottom
            { type: 'rect', x: 400, y: 590, w: 800, h: 40, isGround: true }
        ],
        inkAmount: 500,
        maxBees: 22,
        timer: 10
    },
    // Level 4: Character surrounded, two beehives and narrow space
    {
        name: 'Level 4',
        character: { x: 400, y: 300 },
        beehives: [
            { x: 100, y: 50 },
            { x: 700, y: 50 },
            { x: 400, y: 550 }
        ],
        obstacles: [
            // Left wall segment
            { type: 'rect', x: 200, y: 300, w: 20, h: 200 },
            // Right wall segment
            { type: 'rect', x: 600, y: 300, w: 20, h: 200 },
            // Ground
            { type: 'rect', x: 400, y: 590, w: 800, h: 40, isGround: true }
        ],
        inkAmount: 450,
        maxBees: 25,
        timer: 10
    },
    // Level 5: Hard - multiple beehives, minimal ink
    {
        name: 'Level 5',
        character: { x: 400, y: 350 },
        beehives: [
            { x: 100, y: 80 },
            { x: 700, y: 80 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ],
        obstacles: [
            // Small platform
            { type: 'rect', x: 400, y: 400, w: 100, h: 15 },
            // Ground
            { type: 'rect', x: 400, y: 590, w: 800, h: 40, isGround: true }
        ],
        inkAmount: 400,
        maxBees: 30,
        timer: 10
    }
];
