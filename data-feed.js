
/**
 * Lab 02 — Exercise 3
 * Resilient DataFeed Component
 *
 * Implements asynchronous data loading using
 * a four-state finite state machine.
 */

import { createElement } from "./mini-react.js";
import { useState } from "./reactive-engine.js";

/**
 * Tracks the latest request.
 * Older requests cannot overwrite newer results.
 */
let latestRequestId = 0;

/**
 * Simulates an asynchronous data request.
 *
 * @returns {Promise<string[]>}
 */

/**
 * Simulates a network request.
 * The first request fails; subsequent requests succeed.
 */
let requestCount = 0;

function fetchFeed() {
    return new Promise((resolve, reject) => {
        requestCount += 1;
        const currentRequest = requestCount;

        setTimeout(() => {
            if (currentRequest === 1) {
                reject(new Error(
                    "Connection failed. Please try again."
                ));
                return;
            }

            resolve([
                "Study React Architecture",
                "Practice State Machines",
                "Complete Lab 02"
            ]);
        }, 1200);
    });
}


/**
 * Reactive component for asynchronous data loading.
 *
 * @returns {Object} Virtual DOM node
 */
export function DataFeed() {
    const [state, setState] = useState({
        status: "IDLE"
    });

    
    const loadData = async () => {
        // Assign a unique identity to this request.
        const requestId = ++latestRequestId;

        setState({ status: "LOADING" });

        try {
            const items = await fetchFeed();

            // Ignore outdated responses.
            if (requestId !== latestRequestId) {
                return;
            }

            setState({
                status: "SUCCESS",
                data: items
            });
        } catch (error) {
            // Ignore outdated failures.
            if (requestId !== latestRequestId) {
                return;
            }

            setState({
                status: "ERROR",
                error: error instanceof Error
                    ? error.message
                    : "Unable to load data."
            });
        }
    };


    // IDLE: Waiting for user interaction.
    if (state.status === "IDLE") {
        return createElement(
            "main",
            null,
            createElement("h1", null, "Reactive Data Feed"),
            createElement(
                "button",
                {
                    type: "button",
                    onClick: loadData
                },
                "Load Data"
            )
        );
    }

    // LOADING: Placeholder will be enhanced in Task 3.3.
    
    // LOADING: Display an accessible animated skeleton.
    if (state.status === "LOADING") {
        return createElement(
            "main",
            null,
            createElement("h1", null, "Reactive Data Feed"),

            createElement(
                "div",
                {
                    role: "status",
                    "aria-live": "polite",
                    "aria-label": "Loading data"
                },

                createElement(
                    "p",
                    null,
                    "Loading data..."
                ),

                createElement(
                    "div",
                    {
                        className: "skeleton",
                        "aria-hidden": "true"
                    },
                    createElement("div", {
                        className: "skeleton-line"
                    }),
                    createElement("div", {
                        className: "skeleton-line"
                    }),
                    createElement("div", {
                        className: "skeleton-line"
                    })
                )
            )
        );
    }

    // ERROR: Retry UI will be enhanced in Task 3.3.
    if (state.status === "ERROR") {
        return createElement(
            "main",
            null,
            createElement("h1", null, "Reactive Data Feed"),
            createElement(
                "p",
                { role: "alert" },
                state.error
            ),
            createElement(
                "button",
                {
                    type: "button",
                    onClick: loadData
                },
                "Retry Connection"
            )
        );
    }

    // SUCCESS: Render fetched items.
    if (state.status === "SUCCESS") {
        return createElement(
            "main",
            null,
            createElement("h1", null, "Reactive Data Feed"),
            createElement("h2", null, "Available Items"),
            createElement(
                "ul",
                null,
                state.data.map((item) =>
                    createElement("li", null, item)
                )
            )
        );
    }

    throw new Error("Invalid DataFeed state.");
}
