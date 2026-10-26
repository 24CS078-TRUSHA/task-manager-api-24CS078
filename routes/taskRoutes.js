const express = require("express");

const router = express.Router();

const Task = require("../models/Task");
const authenticateToken = require("../middleware/auth");
const { validateTask } = require("../middleware/requestValidation");
const taskCache = require("../utils/taskCache");
const taskEvents = require("../events");

const ALL_TASKS_CACHE_KEY = "all_tasks";

router.use(authenticateToken);

// GET /tasks
router.get("/", async (req, res, next) => {
  try {
    const cachedTasks = taskCache.get(ALL_TASKS_CACHE_KEY);
    if (cachedTasks !== undefined) {
      res.set("X-Cache", "HIT");
      return res.status(200).json(cachedTasks);
    }

    const tasks = await Task.find().lean();
    taskCache.set(ALL_TASKS_CACHE_KEY, tasks);

    res.set("X-Cache", "MISS");
    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

// GET /tasks/:id
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

// POST /tasks
router.post("/", validateTask, async (req, res, next) => {
  try {
    const task = new Task({
      title: req.body.title,
      description: req.body.description,
      completed: req.body.completed,
      priority: req.body.priority,
    });

    const savedTask = await task.save();
    taskCache.del(ALL_TASKS_CACHE_KEY);

    res.status(201).json({
      message: "Task created successfully",
      task: savedTask,
    });

    const responseSentAt = new Date().toISOString();
    console.log(`[API] Task creation response sent at ${responseSentAt}`);
    taskEvents.emit("task-created", {
      title: savedTask.title,
      timestamp: savedTask.createdAt.toISOString(),
      assignedUser: req.user.id,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /tasks/:id
router.put("/:id", validateTask, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    taskCache.del(ALL_TASKS_CACHE_KEY);

    res.status(200).json({
      message: "Task updated successfully",
      task: task,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    taskCache.del(ALL_TASKS_CACHE_KEY);

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
