import { define, StoreElement } from "@flemminghansen/wc-store";
import { Player, Position, TreeType, Velocity } from "@app/esc/components";
import { Registry } from "@app/esc/registry";
import "@app/shaderfun2";

function update_ui(message: string, className?: string) {
  const app_div = document.getElementById("app");
  if (app_div) {
    const paragraph = document.createElement("p");
    paragraph.classList.add("log-entry");
    if (className) {
      paragraph.classList.add(className);
    }
    paragraph.innerText = message;
    app_div.prepend(paragraph);
  }
}

define(
  "my-app",
  class extends StoreElement {
    registry = new Registry();
    gameSpeedMs = 64;

    #movementSystem() {
      const player_components = this.registry.query(Player, Position, Velocity);
      const tree_entities = this.registry.query(Position, TreeType);
      let did_hit_tree = false;

      for (const [player, pos, vel] of player_components) {
        pos.move(vel);

        did_hit_tree = !tree_entities.every(([tree_pos, tree_type]) => {
          if (pos.get_is_colliding(tree_pos)) {
            if (tree_type.get_is_sapling()) {
              update_ui(
                `${player.get_full_name()} moved to (${pos.x}, ${pos.y}) and trampled a small ${tree_type.species} sapling. What a terrible person!`,
                "event",
              );
              return true;
            }

            update_ui(
              `${player.get_full_name()} moved to (${pos.x}, ${pos.y}) and was killed when hitting a huge ${tree_type.species} tree`,
              "deadly-event",
            );
            return false;
          }

          return true;
        });

        if (did_hit_tree) {
          break;
        }

        update_ui(`${player.get_full_name()} moved to: (${pos.x}, ${pos.y})`);
      }

      if (!did_hit_tree) {
        window.setTimeout(() => {
          update_ui(`--------------- Next Turn ---------------`, "next-turn");
          this.#movementSystem();
        }, this.gameSpeedMs);
      } else {
        update_ui("GAME OVER!", "game-over");
      }
    }

    connectedCallback() {
      this.innerHTML = `<div id="app" style="white-space: pre-line; font-family: monospace;"></div>`;

      // Player entities:

      this.registry.addComponents("Player_1", [
        new Player("El Donaldo", "Trumpet"),
        new Position(0, 0),
        new Velocity(1, 2),
      ]);

      this.registry.addComponents("Player_2", [
        new Player("Vancy", "The Village Idiot"),
        new Position(0, 1),
        new Velocity(1, 1),
      ]);

      this.registry.addComponents("Player_3", [
        new Player("Slette", "Mette"),
        new Position(1, 3),
        new Velocity(2, 1),
      ]);

      // Tree entities:
      this.registry.addComponents("Tree_1", [
        new Position(15, 30),
        new TreeType("Oak", "mature"),
      ]);

      this.registry.addComponents("Tree_2", [
        new Position(8, 16),
        new TreeType("Birch", "sapling"),
      ]);

      this.registry.addComponents("Tree_3", [
        new Position(12, 13),
        new TreeType("Pine", "sapling"),
      ]);

      this.registry.addComponents("Tree_4", [
        new Position(3, 8),
        new TreeType("Pine", "ancient"),
      ]);
      this.#movementSystem();
    }
  },
);
