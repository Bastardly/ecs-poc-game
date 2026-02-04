import { Registry } from "./registry";
import { Player, Velocity, Position, TreeType } from "./components";

function update_ui(message: string, makeBig: boolean = false) {
  const app_div = document.getElementById("app");
  if (app_div) {
    const paragraph = document.createElement("p");
    paragraph.classList.add("log-entry");
    if (makeBig) {
      paragraph.classList.add("make-big");
    }
    paragraph.innerText = message;
    app_div.prepend(paragraph);
  }
}

export function movementSystem(registry: Registry) {
  const player_components = registry.query(Player, Position, Velocity);
  const tree_entities = registry.query(Position, TreeType);
  let did_hit_tree = false;

  for (const [player, pos, vel] of player_components) {
    pos.move(vel);
    update_ui(`${player.get_full_name()} moved to: ${pos.x}, ${pos.y}`);

    did_hit_tree = !tree_entities.every(([tree_pos, tree_type]) => {
      if (pos.get_is_colliding(tree_pos)) {
        if (tree_type.get_is_sapling()) {
          update_ui(
            `${player.get_full_name()} trampled a small ${tree_type.species} sapling. What a terrible person!`,
          );
          return true;
        }

        update_ui(
          `${player.get_full_name()} was killed when hitting a huge ${tree_type.species} tree at: ${pos.x}, ${pos.y}.`,
        );
        return false;
      }

      return true;
    });

    if (did_hit_tree) break;
  }

  if (!did_hit_tree) {
    window.setTimeout(() => {
      update_ui("");
      movementSystem(registry);
    }, 500);
  } else {
    update_ui("GAME OVER!", true);
  }
}
