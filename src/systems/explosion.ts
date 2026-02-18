import { Registry } from "@app/esc/registry";
import { Explosion, Renderable } from "@app/esc/components";

export function explosionSystem(registry: Registry, deltaTime: number) {
  const explosions = registry.queryWithIds(Explosion, Renderable);

  for (const [entityId, explosion, renderable] of explosions) {
    // Update the explosion radius based on progress
    renderable.radius = explosion.getRadius();

    // Tick the lifespan
    const expired = explosion.tick(deltaTime);

    if (expired) {
      registry.deleteEntity(entityId);
    }
  }
}
