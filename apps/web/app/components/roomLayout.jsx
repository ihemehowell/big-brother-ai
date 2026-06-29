// Single source of truth for the house layout.
// Both House.jsx (walls/floors) and WorldState.jsx (avatar placement)
// read from this so the "set" and the "actors" never drift apart.
//
// Coordinate system: x = left/right, z = front/back, y = up.
// Each room is an axis-aligned rectangle defined by its center + size.
// Walls are derived from the gaps between rooms, not hand-placed.

export const WALL_HEIGHT = 4;
export const WALL_THICKNESS = 0.15;

export const ROOMS = {
  bedroom: {
    label: 'Bedroom',
    center: { x: -5, z: -5 },
    size: { width: 6, depth: 5 },
    floor: 'wood',
  },
  bathroom: {
    label: 'Bathroom',
    center: { x: 0, z: -5 },
    size: { width: 4, depth: 5 },
    floor: 'tile',
  },
  diary_room: {
    label: 'Diary Room',
    center: { x: 4.5, z: -5 },
    size: { width: 5, depth: 5 },
    floor: 'walnut',
    isGlassBooth: true,
  },
  kitchen: {
    label: 'Kitchen',
    center: { x: -3.5, z: 0 },
    size: { width: 7, depth: 5 },
    floor: 'tile',
  },
  living_room: {
    label: 'Living Room',
    center: { x: 4, z: 0 },
    size: { width: 8, depth: 5 },
    floor: 'wood',
  },
  backyard: {
    label: 'Backyard',
    center: { x: 0, z: 6 },
    size: { width: 15, depth: 5 },
    floor: 'deck',
    isOutdoor: true,
  },
};

// Where avatars stand when assigned to a room. Multiple "slots" per room
// so contestants don't all stack on the exact same point.
const ROOM_SLOTS = {
  bedroom: [
    { x: -7, z: -6 }, { x: -3, z: -6 }, { x: -7, z: -4 }, { x: -3, z: -4 },
  ],
  bathroom: [
    { x: -1, z: -6 }, { x: 1, z: -4 },
  ],
  diary_room: [
    { x: 4.5, z: -5 },
  ],
  kitchen: [
    { x: -5.5, z: 1 }, { x: -2, z: 1.5 }, { x: -5, z: -1 }, { x: -1.5, z: -1 },
  ],
  living_room: [
    { x: 2, z: 1.5 }, { x: 5, z: 1.5 }, { x: 6.5, z: -1 }, { x: 1.5, z: -1 },
  ],
  backyard: [
    { x: -5, z: 6.5 }, { x: 0, z: 7 }, { x: 5, z: 6.5 }, { x: -2.5, z: 5 },
  ],
};

const usedSlots = {};

/**
 * Deterministically place a contestant within their room, cycling through
 * slots so multiple people in one room get spread out, not stacked.
 */
export function getPositionForRoom(roomKey, contestantId) {
  const room = ROOMS[roomKey];
  const slots = ROOM_SLOTS[roomKey] || ROOM_SLOTS.living_room;

  if (!room) {
    return { x: 0, y: 0, z: 0 };
  }

  if (!usedSlots[roomKey]) usedSlots[roomKey] = {};
  if (usedSlots[roomKey][contestantId] === undefined) {
    const assignedCount = Object.keys(usedSlots[roomKey]).length;
    usedSlots[roomKey][contestantId] = assignedCount % slots.length;
  }

  const slot = slots[usedSlots[roomKey][contestantId]];
  return { x: slot.x, y: 0, z: slot.z };
}

export function clearRoomSlot(roomKey, contestantId) {
  if (usedSlots[roomKey]) {
    delete usedSlots[roomKey][contestantId];
  }
}

// Derive wall segments from room adjacency. Each entry is a wall plane:
// { x, z, length, rotationY } describing its center, length, and facing.
// This keeps House.jsx from hand-placing dozens of individual planes.
export function getOuterWalls() {
  const allX = Object.values(ROOMS).map(r => [r.center.x - r.size.width / 2, r.center.x + r.size.width / 2]).flat();
  const allZ = Object.values(ROOMS).map(r => [r.center.z - r.size.depth / 2, r.center.z + r.size.depth / 2]).flat();
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minZ = Math.min(...allZ);
  const maxZ = Math.max(...allZ);

  return { minX, maxX, minZ, maxZ };
}