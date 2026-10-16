
/**
 * Lab 02 - Exercise 2
 * Task 5.1: Reactive Task Manager UI
 *
 * Features:
 * - Persistent task list
 * - Add Task functionality
 * - Reactive task counter
 * - Semantic and accessible HTML structure
 */

import { createElement } from "./mini-react.js";
import { useState } from "./reactive-engine.js";

/**
 * Reactive Task Manager component.
 *
 * @returns {Object} Virtual DOM tree.
 */
export function TaskManager() {
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState("");

    // Add a task without mutating the existing state array.
    const addTask = () => {
        const taskName = taskInput.trim();

        if (!taskName) {
            return;
        }

        const newTask = {
            id: crypto.randomUUID(),
            title: taskName,
            completed: false
        };

        setTasks((previousTasks) => [
            ...previousTasks,
            newTask
        ]);

        setTaskInput("");
    };

    return createElement(
        "main",
        { className: "task-manager" },

        createElement(
            "header",
            null,
            createElement(
                "h1",
                null,
                "Reactive Task Manager"
            )
        ),

        createElement(
            "section",
            { "aria-labelledby": "task-heading" },

            createElement(
                "h2",
                { id: "task-heading" },
                "Manage your tasks"
            ),

            createElement(
                "label",
                { htmlFor: "task-input" },
                "Task name"
            ),

            createElement(
                "input",
                {
                    id: "task-input",
                    type: "text",
                    value: taskInput,
                    onInput: (event) => {
                        setTaskInput(event.target.value);
                    }
                }
            ),

            createElement(
                "button",
                {
                    type: "button",
                    onClick: addTask
                },
                "Add Task"
            )
        ),

        createElement(
            "section",
            { "aria-labelledby": "task-list-heading" },

            createElement(
                "h2",
                { id: "task-list-heading" },
                "Task List"
            ),

            createElement(
                "p",
                {
                    role: "status",
                    "aria-live": "polite",
                    "aria-atomic": "true"
                },
                `Total tasks: ${tasks.length}`
            ),

            createElement(
                "ul",
                null,
                tasks.map((task) =>
                    createElement(
                        "li",
                        { "data-task-id": task.id },
                        task.title
                    )
                )
            )
        )
    );
}
