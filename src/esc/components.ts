export class Velocity {
  dx: number;
  dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  move(velocity: Velocity) {
    this.x += velocity.dx;
    this.y += velocity.dy;
  }

  get_is_colliding(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Player {
  first_name: string;
  last_name: string;

  constructor(first_name: string, last_name: string) {
    this.first_name = first_name;
    this.last_name = last_name;
  }

  get_full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

type TreeSpecies = "Oak" | "Pine" | "Birch";
type TreeSize = "sapling" | "mature" | "ancient";

export class TreeType {
  species: TreeSpecies;
  size: TreeSize;

  constructor(species: TreeSpecies, size: TreeSize) {
    this.species = species;
    this.size = size;
  }

  get_is_sapling(): boolean {
    return this.size === "sapling";
  }
}
