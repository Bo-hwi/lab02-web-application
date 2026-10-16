
/**
 * Lab 02 - Exercise 2
 * Task 1.1: State Store and Hook Cursor
 *
 * Maintains state outside functional components.
 */

// Persistent state storage across render passes.
const stateStore = [];

// Tracks the current hook position during rendering.
let cursor = 0;

/**
 * Resets the hook cursor before a new render pass.
 * Existing state values remain unchanged.
 */
export function resetCursor() {
    cursor = 0;
}
