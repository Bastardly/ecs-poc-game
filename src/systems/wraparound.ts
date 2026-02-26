import { Registry } from "@app/esc/registry";
import { Position, Ship, Bullet } from "@app/esc/components";

export function wraparoundSystem(
  registry: Registry,
  canvasWidth: number,
  canvasHeight: number,
) {
  const padding = 100;

  // Handle ships (player and enemies) - clamp vertically, wrap horizontally
  const ships = registry.query(Ship, Position);
  for (const [ship, position] of ships) {
    // Clamp vertical position (no wrapping top/bottom)
    position.y = Math.max(15, Math.min(canvasHeight - 15, position.y));

    // Wrap horizontal
    if (position.x > canvasWidth + padding) {
      position.x = -padding;
    } else if (position.x < -padding) {
      position.x = canvasWidth + padding;
    }
  }

  // Handle all other entities (damage indicators, explosions, etc.)
  // Exclude bullets - let them go off screen and be cleaned up by lifespan
  const allEntities = registry.query(Position);
  const shipPositions = new Set<Position>();
  for (const [ship, position] of ships) {
    shipPositions.add(position);
  }

  // Get bullet positions to exclude them
  const bulletPositions = new Set<Position>();
  const bullets = registry.query(Bullet, Position);
  for (const [bullet, position] of bullets) {
    bulletPositions.add(position);
  }

  for (const [position] of allEntities) {
    // Skip if this is a ship or bullet
    if (shipPositions.has(position) || bulletPositions.has(position)) continue;

    // Wrap vertical (scrolling)
    if (position.y > canvasHeight + padding) {
      position.y = -padding;
    } else if (position.y < -padding) {
      position.y = canvasHeight + padding;
    }

    // Wrap horizontal
    if (position.x > canvasWidth + padding) {
      position.x = -padding;
    } else if (position.x < -padding) {
      position.x = canvasWidth + padding;
    }
  }
}
