
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

/**
 * Converts a Virtual DOM tree into real browser DOM nodes.
 * Handles safe text rendering, HTML attributes, events,
 * accessibility properties, and recursive child mounting.
 */
export function renderToDOM(vNode) {
    // 1. Safely render text without parsing HTML (XSS prevention).
    if (vNode.type === "TEXT_ELEMENT") {
        return document.createTextNode(vNode.props.nodeValue ?? "");
    }

    // 2. Resolve function components when provided.
    if (typeof vNode.type === "function") {
        return renderToDOM(vNode.type(vNode.props));
    }

    // 3. Create a native HTML element.
    const element = document.createElement(vNode.type);

    // 4. Map Virtual DOM props to real DOM attributes and events.
    for (const [key, value] of Object.entries(vNode.props ?? {})) {
        // Skip internal properties and nullish values.
        if (
            key === "children" ||
            key === "nodeValue" ||
            key === "key" ||
            value === null ||
            value === undefined
        ) {
            continue;
        }

        // Attach event listeners without inline HTML handlers.
                // Block all case variations of inline event attributes.
        if (/^on/i.test(key)) {
            // Register only valid function-based event handlers.
            if (
                /^on[A-Z]/.test(key) &&
                typeof value === "function"
            ) {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            }

            // Never serialize event handlers into HTML attributes.
            continue;
        }

        // Map JSX-style props to native HTML attributes.
        const attributeName =
            key === "className" ? "class" :
            key === "htmlFor" ? "for" :
            key === "tabIndex" ? "tabindex" :
            key;

        // Disallow HTML injection through embedded documents.
        if (attributeName.toLowerCase() === "srcdoc") {
            continue;
        }

        // Block dangerous URL schemes in URL-bearing attributes.
        const urlAttributes = [
            "href", "src", "action", "formaction", "xlink:href"
        ];

        if (urlAttributes.includes(attributeName.toLowerCase())) {
            const normalizedURL = String(value)
                .replace(/[\u0000-\u0020]/g, "")
                .toLowerCase();

            if (/^(javascript|vbscript|data):/.test(normalizedURL)) {
                continue;
            }
        }

        // Handle native boolean HTML attributes correctly.
        const booleanAttributes = [
            "disabled", "required", "checked", "multiple",
            "selected", "readonly", "autofocus"
        ];

        if (
            typeof value === "boolean" &&
            booleanAttributes.includes(attributeName.toLowerCase())
        ) {
            if (value) {
                element.setAttribute(attributeName, "");
            }
            continue;
        }

        // Preserve role, aria-*, data-*, alt, and other attributes.
        element.setAttribute(attributeName, String(value));
    }

    // 5. Recursively mount all child VNodes.
    for (const child of vNode.props.children) {
        element.appendChild(renderToDOM(child));
    }

    // 6. Return the completed DOM node.
    return element;
}
