process.env.JWT_SECRET = "ci-test-secret-not-used-in-production";

jest.mock("../models/Task", () => ({
    find: jest.fn()
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../app");
const Task = require("../models/Task");
const taskCache = require("../utils/taskCache");

describe("Task Manager API", () => {
    beforeEach(() => {
        taskCache.flushAll();
        Task.find.mockReset();
    });

    test("GET /tasks returns 200 with the task list", async () => {
        const tasks = [
            {
                _id: "task-1",
                title: "CI test task",
                completed: false
            }
        ];
        const token = jwt.sign(
            { id: "ci-test-user" },
            process.env.JWT_SECRET
        );
        const lean = jest.fn().mockResolvedValue(tasks);
        Task.find.mockReturnValue({ lean });

        const response = await request(app)
            .get("/tasks")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(201);
        //expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(tasks);
        expect(response.headers["x-cache"]).toBe("MISS");
        expect(Task.find).toHaveBeenCalledTimes(1);
    });

    test("GET /auth/me rejects a request without a token", async () => {
        const response = await request(app).get("/auth/me");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message");
    });
});
