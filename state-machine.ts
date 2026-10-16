
/**
 * Lab 02 — Exercise 3
 * Resilient State Machine Contract
 *
 * Defines the four valid states of an asynchronous
 * data-loading component.
 */

export type ViewState<T> =
    | { status: "IDLE" }
    | { status: "LOADING" }
    | { status: "SUCCESS"; data: T }
    | { status: "ERROR"; error: string };
