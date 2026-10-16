
/**
 * Lab 02 - Exercise 1
 * Mini-React Virtual DOM Element Factory
 */

/**
 * Creates a Virtual DOM text node.
 * Text is stored as plain data, not interpreted as HTML.
 */
export function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: String(text),
            children: []
        }
    };
}

/**
 * Creates a Virtual DOM element.
 * Normalizes nested children while preserving accessibility props.
 */
export function createElement(type, props, ...children) {
    // Flatten nested arrays and remove empty child values.
    const normalizedChildren = children
        .flat(Infinity)
        .filter(
            (child) =>
                child !== null &&
                child !== undefined &&
                child !== false
        )
        .map((child) => {
            // Type checking: wrap strings and numbers in text VNodes.
            if (
                typeof child === "string" ||
                typeof child === "number"
            ) {
                return createTextElement(child);
            }

            // Preserve existing VNodes without modification.
            return child;
        });

    return {
        type,
        props: {
            // Preserve role, aria-*, tabIndex, and other props.
            ...(props ?? {}),
            children: normalizedChildren
        }
    };
}
