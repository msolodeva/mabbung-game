# Mabbung Character Replacement

## Goal
Replace the game's Mabbung character sprite with the provided image of a child (`IMG_2097.jpg`).

## Plan 
- [x] Locate the current character sprite usage in the codebase.
- [x] Extract the child's face from `/Users/seungwan/Downloads/IMG_2097.jpg` and create a suitable transparent sprite.
- [x] Implement the newly created sprite in the game.
- [x] Test the game to verify the character appears correctly.

## Working Notes
- The image is located at `/Users/seungwan/Downloads/IMG_2097.jpg`
- Successfully created `/public/mabbung_face.png`.
- Replaced Shiba Dog vector drawing logic in `Game.js` with `ctx.drawImage` utilizing the new sprite.
- Replaced the emoji in `index.html` with an image tag pointing to the new sprite.
- Build succeeded.
