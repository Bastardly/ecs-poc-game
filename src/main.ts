import { define, StoreElement } from "@flemminghansen/wc-store";
import { ecs_tester } from "@app/esc/ecs";
import "@app/shaderfun2";

define(
  "my-app",
  class extends StoreElement {
    connectedCallback() {
      ecs_tester();
      this.innerHTML = `<div id="app" style="white-space: pre-line; font-family: monospace;"></div>`;
    }
  },
);
