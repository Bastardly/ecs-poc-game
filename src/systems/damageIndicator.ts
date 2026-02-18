import { Registry } from "@app/esc/registry";
import { DamageIndicator, Position, Velocity } from "@app/esc/components";

export function damageIndicatorSystem(registry: Registry, deltaTime: number) {
  const indicators = registry.queryWithIds(DamageIndicator, Position, Velocity);

  for (const [entityId, indicator, position, velocity] of indicators) {
    // Move the indicator
    position.x += velocity.dx * (deltaTime / 1000);
    position.y += velocity.dy * (deltaTime / 1000);

    // Tick the lifespan
    const expired = indicator.tick(deltaTime);

    if (expired) {
      registry.deleteEntity(entityId);
    }
  }
}
