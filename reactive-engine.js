
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
// Re-render callback, registered by renderApp in a later task.
let triggerRender = () => {};
/**
 * Resets the hook cursor before a new render pass.
 * Existing state values remain unchanged.
 */
export function resetCursor() {
    cursor = 0;
}

/**
 * Creates a persistent state slot for a functional component.
 *
 * @param {*} initialValue - Initial state value.
 * @returns {[*, Function]} Current state and its setter.
 */
export function useState(initialValue) {
    // Capture the hook index for this render pass.
    const currentIndex = cursor;

    // Initialize only if this state slot does not exist.
    // This preserves valid null and undefined state values.
    if (!Object.prototype.hasOwnProperty.call(stateStore, currentIndex)) {
        stateStore[currentIndex] = initialValue;
    }

    // Read the current state before advancing the cursor.
    const currentState = stateStore[currentIndex];

    /**
     * Updates the state associated with this specific hook.
     */
    const setState = (nextValue) => {
        const previousState = stateStore[currentIndex];

        // Support functional updater: setState(prev => prev + 1).
        const resolvedValue =
            typeof nextValue === "function"
                ? nextValue(previousState)
                : nextValue;

        // Avoid unnecessary renders when the value is unchanged.
        if (Object.is(previousState, resolvedValue)) {
            return;
        }

        stateStore[currentIndex] = resolvedValue;

        // Rendering integration belongs to Task 3.1.
        triggerRender();
    };

    // Advance to the next hook slot.
    cursor++;

    return [currentState, setState];
}
