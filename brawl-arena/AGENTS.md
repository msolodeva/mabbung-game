# AGENTS.md

## Project

Brawl Arena is a two-player top-down canvas game inspired by Gem Grab. It uses browser-native ES modules, HTML, and CSS with no build step.

## Commands

```bash
npm test       # Run all Node tests
npm run serve  # Serve at http://localhost:8000
```

## Structure

- `js/app/`: application startup, lobby state, and session orchestration
- `js/game/`: game loop, rendering, and game-screen UI
- `js/entities/`: shared entities and brawler implementations
- `js/ai/`: AI decisions and pathfinding
- `js/modes/`: match rules
- `js/map/`: map runtime and definitions
- `js/utils/constants.js`: gameplay configuration and balance values
- `tests/`: Node test suite

## Guidelines

- Preserve browser-native ES modules and avoid adding a build system unless requested.
- Keep gameplay state out of DOM controllers; keep rendering/UI concerns out of entities.
- Add balance values to `js/utils/constants.js` rather than scattering literals.
- Pair behavior changes with a focused test and run `npm test` before handoff.
- Run the app through a local server; opening `index.html` directly is unsupported.
