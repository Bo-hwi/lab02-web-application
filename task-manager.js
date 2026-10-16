
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
    
    // Current task filter: all, active, or completed.
    const [filter, setFilter] = useState("all");


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
    
    /**
     * Toggles the completion status of a task.
     * Uses immutable updates to preserve state integrity.
     */
    const toggleTask = (taskId) => {
        setTasks((previousTasks) =>
            previousTasks.map((task) =>
                task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task
            )
        );
    };
    
    /**
     * Select tasks based on the active filter.
     * Keep the original tasks array unchanged.
     */
    const filteredTasks = tasks.filter((task) => {
        if (filter === "active") {
            return !task.completed;
        }

        if (filter === "completed") {
            return task.completed;
        }

        return true;
    });


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
                "nav",
                { "aria-label": "Task filters" },

                ...[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "completed", label: "Completed" }
                ].map((option) =>
                    createElement(
                        "button",
                        {
                            type: "button",
                            "aria-pressed": filter === option.value,
                            onClick: () => setFilter(option.value)
                        },
                        option.label
                    )
                )
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
                
                filteredTasks.map((task) =>
                    createElement(
                        "li",
                        { "data-task-id": task.id },

                        createElement(
                            "span",
                            null,
                            task.completed
                                ? `${task.title} (Completed)`
                                : `${task.title} (Active)`
                        ),

                        " ",

                        createElement(
                            "button",
                            {
                                id: `task-toggle-${task.id}`,
                                type: "button",
                                "aria-pressed": task.completed,
                                "aria-label": task.completed
                                    ? `Mark ${task.title} as active`
                                    : `Mark ${task.title} as completed`,
                                onClick: () => toggleTask(task.id)
                            },
                            task.completed ? "Undo" : "Complete"
                        )
                    )
                )
            )
        )
    );
}
