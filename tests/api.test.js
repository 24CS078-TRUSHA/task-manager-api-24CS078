process.env.JWT_SECRET = "ci-test-secret-not-used-in-production";

jest.mock("../models/Task", () => ({
    find: jest.fn()
}));

const originalFetch = global.fetch;
const originalGeminiApiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.GEMINI_MODEL;

beforeEach(() => {
    global.fetch = jest.fn();
});

afterAll(() => {
    global.fetch = originalFetch;
    if (originalGeminiApiKey === undefined) {
        delete process.env.GEMINI_API_KEY;
    } else {
        process.env.GEMINI_API_KEY = originalGeminiApiKey;
    }
    if (originalGeminiModel === undefined) {
        delete process.env.GEMINI_MODEL;
    } else {
        process.env.GEMINI_MODEL = originalGeminiModel;
    }
});

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

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(tasks);
        expect(response.headers["x-cache"]).toBe("MISS");
        expect(Task.find).toHaveBeenCalledTimes(1);
    });

    test("GET /auth/me rejects a request without a token", async () => {
        const response = await request(app).get("/auth/me");

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("message");
    });

    test("POST /api/ai/generate-description returns a Gemini description", async () => {
        process.env.GEMINI_API_KEY = "ci-test-gemini-key";
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{ text: "Review the draft and send feedback." }]
                    }
                }]
            })
        });
        const token = jwt.sign(
            { id: "ci-test-user" },
            process.env.JWT_SECRET
        );

        const response = await request(app)
            .post("/api/ai/generate-description")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Review project draft" });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            description: "Review the draft and send feedback."
        });
        const [requestUrl, requestOptions] = global.fetch.mock.calls[0];
        expect(requestUrl).toBe(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"
        );
        expect(requestOptions.headers["x-goog-api-key"]).toBe("ci-test-gemini-key");
        expect(JSON.parse(requestOptions.body)).toMatchObject({
            contents: [{
                parts: [{
                    text: "Write a description for this task: Review project draft"
                }]
            }]
        });
    });

    test("POST /api/ai/generate-description returns a fallback when AI is unavailable", async () => {
        delete process.env.GEMINI_API_KEY;
        const token = jwt.sign(
            { id: "ci-test-user" },
            process.env.JWT_SECRET
        );

        const response = await request(app)
            .post("/api/ai/generate-description")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Review project draft" });

        expect(response.statusCode).toBe(503);
        expect(response.body.fallback).toBe(true);
        expect(response.body.message).toMatch(/enter a description manually/i);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test("POST /api/ai/generate-description returns a fallback when the provider fails", async () => {
        process.env.GEMINI_API_KEY = "ci-test-gemini-key";
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => JSON.stringify({
                error: { message: "Model not found" }
            })
        });
        const token = jwt.sign(
            { id: "ci-test-user" },
            process.env.JWT_SECRET
        );

        const response = await request(app)
            .post("/api/ai/generate-description")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Review project draft" });

        expect(response.statusCode).toBe(502);
        expect(response.body.fallback).toBe(true);
        expect(response.body.message).toMatch(/enter a description manually/i);
    });

    test("POST /api/ai/generate-description rejects a blank title", async () => {
        process.env.GEMINI_API_KEY = "ci-test-gemini-key";
        const token = jwt.sign(
            { id: "ci-test-user" },
            process.env.JWT_SECRET
        );

        const response = await request(app)
            .post("/api/ai/generate-description")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "   " });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/title is required/i);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
