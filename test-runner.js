
/**
 * Lab 02 - Exercise 1
 * Task 4.1: VNode Normalization Tests
 *
 * Uses Node.js built-in testing utilities.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
    createTextElement,
    createElement
} from "./mini-react.js";

// Test 1: Text node normalization.
test("createTextElement normalizes text values", () => {
    const textNode = createTextElement(123);

    assert.equal(textNode.type, "TEXT_ELEMENT");
    assert.equal(textNode.props.nodeValue, "123");
    assert.deepEqual(textNode.props.children, []);
});

// Test 2: Handle null props safely.
test("createElement handles null props", () => {
    const vnode = createElement("main", null, "Hello UIT");

    assert.equal(vnode.type, "main");
    assert.equal(vnode.props.children.length, 1);
    assert.equal(
        vnode.props.children[0].props.nodeValue,
        "Hello UIT"
    );
});

// Test 3: Flatten nested children.
test("createElement flattens nested arrays", () => {
    const vnode = createElement(
        "section",
        {},
        ["First", ["Second", 3]]
    );

    assert.equal(vnode.props.children.length, 3);
    assert.deepEqual(
        vnode.props.children.map(
            (child) => child.props.nodeValue
        ),
        ["First", "Second", "3"]
    );
});

// Test 4: Remove empty child values.
test("createElement filters empty children", () => {
    const vnode = createElement(
        "section",
        null,
        null,
        undefined,
        false,
        "Visible"
    );

    assert.equal(vnode.props.children.length, 1);
    assert.equal(
        vnode.props.children[0].props.nodeValue,
        "Visible"
    );
});

// Test 5: Preserve accessibility attributes.
test("createElement preserves accessibility props", () => {
    const vnode = createElement(
        "button",
        {
            role: "button",
            "aria-label": "Add task",
            tabIndex: 0
        },
        "Add"
    );

    assert.equal(vnode.props.role, "button");
    assert.equal(vnode.props["aria-label"], "Add task");
    assert.equal(vnode.props.tabIndex, 0);
});

// Test 6: Do not mutate input props.
test("createElement does not mutate original props", () => {
    const originalProps = {
        id: "test",
        className: "container"
    };

    createElement("section", originalProps, "Hello");

    assert.deepEqual(originalProps, {
        id: "test",
        className: "container"
    });
});
