
import test from "node:test";
import assert from "node:assert/strict";
import { createRequestGuard } from "./data-feed.js";

test("Older successful response cannot overwrite newer data", async () => {
    const guard = createRequestGuard();
    const results = [];

    let resolveOld;
    let resolveNew;

    const oldPromise = new Promise(resolve => {
        resolveOld = resolve;
    });

    const newPromise = new Promise(resolve => {
        resolveNew = resolve;
    });

    async function runRequest(promise) {
        const id = guard.start();
        const data = await promise;

        if (guard.isCurrent(id)) {
            results.push(data);
        }
    }

    const oldRequest = runRequest(oldPromise);
    const newRequest = runRequest(newPromise);

    // New request finishes first.
    resolveNew("NEW DATA");
    await newRequest;

    // Old request finishes later.
    resolveOld("OLD DATA");
    await oldRequest;

    assert.deepEqual(results, ["NEW DATA"]);
});

test("Older failure cannot overwrite newer state", async () => {
    const guard = createRequestGuard();
    const results = [];

    let rejectOld;
    let resolveNew;

    const oldPromise = new Promise((_, reject) => {
        rejectOld = reject;
    });

    const newPromise = new Promise(resolve => {
        resolveNew = resolve;
    });

    async function runRequest(promise) {
        const id = guard.start();

        try {
            const value = await promise;

            if (guard.isCurrent(id)) {
                results.push({ status: "SUCCESS", value });
            }
        } catch (error) {
            if (guard.isCurrent(id)) {
                results.push({
                    status: "ERROR",
                    message: error.message
                });
            }
        }
    }

    const oldRequest = runRequest(oldPromise);
    const newRequest = runRequest(newPromise);

    resolveNew("CURRENT DATA");
    await newRequest;

    rejectOld(new Error("Outdated network error"));
    await oldRequest;

    assert.deepEqual(results, [
        { status: "SUCCESS", value: "CURRENT DATA" }
    ]);
});

test("The latest request remains valid", () => {
    const guard = createRequestGuard();

    const first = guard.start();
    const second = guard.start();

    assert.equal(guard.isCurrent(first), false);
    assert.equal(guard.isCurrent(second), true);
});
