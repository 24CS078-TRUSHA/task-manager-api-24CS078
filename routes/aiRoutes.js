const express = require("express");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.post("/generate-description", authenticateToken, async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";

    if (!title) {
        return res.status(400).json({
            message: "A task title is required to generate a description."
        });
    }

    if (title.length > 200) {
        return res.status(400).json({
            message: "Task title must be 200 characters or fewer."
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            fallback: true,
            message: "AI description generation is unavailable. You can enter a description manually."
        });
    }

    try {
        const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
            {
                method: "POST",
                headers: {
                    "x-goog-api-key": process.env.GEMINI_API_KEY,
                    "Content-Type": "application/json"
                },
                signal: AbortSignal.timeout(15000),
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{
                            text: "Write one concise, actionable task description in one or two sentences. Return only the description."
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: `Write a description for this task: ${title}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 120
                    }
                })
            }
        );

        if (!response.ok) {
            const providerError = await response.text();
            console.error(
                `Gemini description request failed with status ${response.status}: ${providerError.slice(0, 500)}`
            );
            return res.status(502).json({
                fallback: true,
                message: "AI description generation failed. You can enter a description manually."
            });
        }

        const result = await response.json();
        const description = result.candidates?.[0]?.content?.parts
            ?.map((part) => part.text)
            .filter((text) => typeof text === "string")
            .join("\n")
            .trim();

        if (typeof description !== "string" || !description) {
            console.error("Gemini description response did not contain generated text");
            return res.status(502).json({
                fallback: true,
                message: "AI did not return a description. You can enter one manually."
            });
        }

        return res.status(200).json({ description });
    } catch (error) {
        const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
        console.error(
            timedOut
                ? "Gemini description request timed out"
                : "Gemini description request failed",
            error.name
        );
        return res.status(timedOut ? 504 : 502).json({
            fallback: true,
            message: timedOut
                ? "AI description generation timed out. You can enter a description manually."
                : "AI description generation failed. You can enter a description manually."
        });
    }
});

module.exports = router;
