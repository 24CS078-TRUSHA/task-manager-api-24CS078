const taskEvents = require("./events");

taskEvents.on("task-created", ({ title, timestamp, assignedUser }) => {
    setTimeout(() => {
        console.log(
            `[Notification] Task "${title}" created at ${timestamp}; assigned user: ${assignedUser}; listener completed at ${new Date().toISOString()}`
        );
    }, 150);
});
