# Brawler balance pass — 2026-09-12

This pass keeps the six existing roles and addresses damage stacking, artillery targeting and large resource-efficiency gaps. These are controlled combat checks, not measured player win rates. Human play on the five maps remains necessary to assess the final matchup balance.

| Brawler | Change | Purpose |
| --- | --- | --- |
| Brock | Normal knockback 90 → 45; super 520 × 6 → 380 × 6, knockback 140 → 90 | Preserve long-range rocket pressure but reduce automatic disengagement and close-range super deletion. |
| Nita | Health 5600 → 5000; super requires 7 → 5 hits and deals 1100 → 1250 | Retain the strongest frontline health and piercing wave while exchanging some passive durability for an active tool. |
| Colt | Bullet 300 → 260; reload 1550 → 1650 ms; super requires 12 → 18 hits and deals 260 → 200 per bullet | Keep speed and range, but require sustained aim rather than exceptional burst plus exceptional super generation. |
| Dynamike | Reload 1850 → 1700 ms; throw distance adjusts to an enemy in a ±0.35 rad aim cone; minimum throw distance 180 | Fixed maximum-range landing missed stationary midrange targets. Distance assistance preserves chosen aim and allows throws over cover. Close-range dives remain a weakness. |
| Spike | Main hit 480 → 600; reload 1750 → 1550 ms; super requires 10 → 8 hits | Raise weak direct pressure while keeping the split burst limited to one hit per target and preserving area control. |
| Mortis | Super hits each enemy once for 1000 instead of up to 850 × 3; heal 60% of actual health lost | Keep multi-enemy piercing and sustain, remove point-blank triple damage and healing from overkill. Dash combo unchanged. |

Dynamike shows a landing circle during the fuse. The destination is fixed at launch: walking out of it avoids damage. Friendly, dead, behind or off-angle targets do not pull the throw. No target means the original maximum-range throw.

Knockback decay uses elapsed time rather than one friction multiplier per rendered frame, reducing refresh-rate differences in disengagement.

## Controlled comparison

Normal attack ceiling per ammo (all bullets/split hits connect):

| Brawler | Before | After | Full starting ammo after |
| --- | ---: | ---: | ---: |
| Brock | 1250 | 1250 | 3750 |
| Nita | 900 | 900 | 2700 |
| Colt | 1800 | 1560 | 4680 |
| Dynamike | 1150 | 1150 | 3450 |
| Spike | 720 | 840 | 2520 |
| Mortis | 800 | 800 | 2400 |

These are damage ceilings, not DPS or guaranteed damage. Colt must land six sequential bullets; Spike requires both the main projectile and a split spike; Dynamike has a 740 ms fuse; Mortis spends ammo on movement and must reach melee range. AoE and piercing reward hitting several enemies. Reload timers and initial ammo further affect sustained output.

## Regression checks

- Mortis swarm hits two aligned enemies once each, heals from both, and does not recharge its super.
- A target with only 100 health yields 60 healing, not the full hit's nominal healing.
- Dynamike hits a stationary midrange enemy over cover after the fuse, can be dodged, and retains a close-range blind spot.
- Nita survives the three-dash combo and can charge super in five wave hits.
- Even all six Brock super rockets cannot kill a full-health Colt alone.
- Existing Spike split-hit, slow, Colt cadence, projectile collision and pause tests remain in place.
