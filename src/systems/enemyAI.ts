import { Registry } from "@app/esc/registry";
import { Position, Velocity, Ship, Enemy } from "@app/esc/components";
import { ENEMY_SPEED, SCROLL_SPEED } from "@app/game/constants";

export function enemyAISystem(registry: Registry) {
  // Find player position
  const players = registry.query(Ship, Position);
  let playerPos: Position | null = null;

  for (const [ship, position] of players) {
    if (ship.type === "player") {
      playerPos = position;
      break;
    }
  }

  if (!playerPos) return; // No player found

  // Update all enemy velocities and rotation to move toward player
  const enemies = registry.query(Enemy, Position, Velocity, Ship);

  for (const [enemy, enemyPos, enemyVel, ship] of enemies) {
    const dx = playerPos.x - enemyPos.x;
    const dy = playerPos.y - enemyPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize and apply speed (no scroll - enemies stay in screen space)
      enemyVel.dx = (dx / distance) * ENEMY_SPEED;
      enemyVel.dy = (dy / distance) * ENEMY_SPEED;

      // Set rotation to face player
      // Negate dy for coordinate system, add π/2 for sprite facing down
      ship.rotation = Math.atan2(-dy, dx) + Math.PI / 2;
    }
  }
}
