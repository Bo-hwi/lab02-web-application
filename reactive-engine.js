
/**
 * Lab 02 - Exercise 2
 * Task 1.1: State Store and Hook Cursor
 *
 * Maintains state outside functional components.
 */

// Persistent state storage across render passes.
const stateStore = [];
import { renderToDOM } from "./mini-react.js";
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

    
/**
 * Initializes and manages the root component lifecycle.
 *
 * @param {Function} Component - Root functional component.
 * @param {Element} rootContainer - Browser DOM container.
 */
export function renderApp(Component, rootContainer) {
    // Validate the root component and mounting container.
    if (typeof Component !== "function") {
        throw new TypeError("Component must be a function.");
    }

    if (
        !rootContainer ||
        typeof rootContainer.replaceChildren !== "function"
    ) {
        throw new TypeError("Invalid root container.");
    }

    // Define the rendering lifecycle.
    const rerender = () => {
        // Reset hook ordering without clearing stored state.
        resetCursor();

        // Execute the component to generate a new VNode tree.
        const vNode = Component();

        
        // Preserve focus and text selection across DOM replacement.
        const activeElement = document.activeElement;

        const focusedId =
            activeElement && rootContainer.contains(activeElement)
                ? activeElement.id
                : null;

        let selectionStart = null;
        let selectionEnd = null;

        // Save caret position for supported text inputs.
        if (
            activeElement instanceof HTMLInputElement &&
            focusedId
        ) {
            try {
                selectionStart = activeElement.selectionStart;
                selectionEnd = activeElement.selectionEnd;
            } catch {
                // Some input types do not support text selection.
            }
        }

        // Convert the VNode tree into real DOM nodes.
        const domNode = renderToDOM(vNode);

        // Replace the previous root content.
        rootContainer.replaceChildren(domNode);

        // Restore focus only when a matching element still exists.
        if (focusedId) {
            const nextElement = Array.from(
                rootContainer.querySelectorAll("[id]")
            ).find((node) => node.id === focusedId);

            if (
                nextElement &&
                typeof nextElement.focus === "function"
            ) {
                nextElement.focus({ preventScroll: true });

                // Restore caret position when supported.
                if (
                    selectionStart !== null &&
                    selectionEnd !== null &&
                    typeof nextElement.setSelectionRange === "function"
                ) {
                    nextElement.setSelectionRange(
                        selectionStart,
                        selectionEnd
                    );
                }
            }
        }


    };

    // Connect state updates to this rendering lifecycle.
    triggerRender = rerender;

    // Perform the initial render.
    rerender();

    
    /**
     * Register one delegated listener per supported event type.
     * Events bubble from child elements to the root container.
     */
    // Track delegated event types already installed on this root.
    if (!rootContainer.__delegatedEvents) {
        rootContainer.__delegatedEvents = new Set();
    }

    const supportedEvents = ["click", "input", "keydown"];

    // Track delegated event types already installed on this root.
    if (!rootContainer.__delegatedEvents) {
        rootContainer.__delegatedEvents = new Set();
    }

    for (const eventType of supportedEvents) {
        // Prevent duplicate listener registration on the same root.
        if (rootContainer.__delegatedEvents.has(eventType)) {
            continue;
        }

        rootContainer.__delegatedEvents.add(eventType);
        rootContainer.addEventListener(eventType, (event) => {
            let target = event.target;

            // Walk from the event target toward the root.
            while (target && target !== rootContainer) {
                const handler = target.__handlers?.[eventType];

                if (typeof handler === "function") {
                    handler(event);
                }

                // Respect propagation cancellation.
                if (event.cancelBubble) {
                    break;
                }

                target = target.parentNode;
            }
        });
    }



}
