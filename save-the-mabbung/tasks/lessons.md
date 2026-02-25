# Lessons Learned

## Bug: Bees disappear instantly
- **Symptom**: Bees are not visible in the game.
- **Root Cause**: The force applied to counteract gravity `Matter.Body.applyForce(body, position, {y: -body.mass * gravity.y})` did not multiply by `gravity.scale` (0.001). This resulted in a force 1000x stronger than gravity, causing the bees to shoot off the top of the canvas instantly.
- **Fix**: Multiple gravity by `gravity.scale` when applying anti-gravity force.
- **Prevention**: When working with `Matter.js` gravity, always remember that global `engine.gravity` includes a `scale` multiplier.
