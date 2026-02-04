import { Player, Position, TreeType, Velocity } from "./components";
import { Registry } from "./registry";
import { movementSystem } from "./system";

// --- Usage ---
export function ecs_tester() {
  const registry = new Registry();

  // Player entities:
  const player_1 = "Player_1";
  registry.addComponent(player_1, new Player("El Donaldo", "Trumpet"));
  registry.addComponent(player_1, new Position(0, 0));
  registry.addComponent(player_1, new Velocity(1, 2));

  const player_2 = "Player_2";
  registry.addComponent(player_2, new Player("Vancy", "The Village Idiot"));
  registry.addComponent(player_2, new Position(0, 1));
  registry.addComponent(player_2, new Velocity(1, 1));

  // Tree entities:
  const tree_1 = "Tree_1";
  registry.addComponent(tree_1, new Position(15, 30));
  registry.addComponent(tree_1, new TreeType("Oak", "mature"));

  const tree_2 = "Tree_2";
  registry.addComponent(tree_2, new Position(8, 16));
  registry.addComponent(tree_2, new TreeType("Birch", "sapling"));

  const tree_3 = "Tree_3";
  registry.addComponent(tree_3, new Position(12, 13));
  registry.addComponent(tree_3, new TreeType("Pine", "sapling"));

  const tree_4 = "Tree_4";
  registry.addComponent(tree_4, new Position(3, 8));
  registry.addComponent(tree_4, new TreeType("Pine", "ancient"));

  movementSystem(registry);
}
