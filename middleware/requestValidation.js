const allowedTaskFields = ["title", "description", "completed", "priority"];

function invalidBody(req) {
    return !req.body || typeof req.body !== "object" || Array.isArray(req.body);
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Validation failed",
        errors
    });
}

function validateCredentials(req, res, next) {
    if (invalidBody(req)) {
        return sendValidationError(res, {
            body: "Request body must be a JSON object"
        });
    }

    const { email, password } = req.body;
    const errors = {};

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "A valid email address is required";
    }

    if (typeof password !== "string") {
        errors.password = "A password is required";
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters";
    } else if (Buffer.byteLength(password, "utf8") > 72) {
        errors.password = "Password must not exceed 72 bytes";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    req.body.email = email.trim().toLowerCase();
    return next();
}

function validateTask(req, res, next) {
    if (invalidBody(req)) {
        return sendValidationError(res, {
            body: "Request body must be a JSON object"
        });
    }

    const errors = {};
    const sanitized = {};
    const isUpdate = req.method === "PUT";

    for (const field of Object.keys(req.body)) {
        if (!allowedTaskFields.includes(field)) {
            errors[field] = "This field is not allowed";
        }
    }

    if (!isUpdate || Object.hasOwn(req.body, "title")) {
        if (typeof req.body.title !== "string" || !req.body.title.trim()) {
            errors.title = "A non-empty title is required";
        } else {
            sanitized.title = req.body.title.trim();
        }
    }

    if (Object.hasOwn(req.body, "description")) {
        if (typeof req.body.description !== "string") {
            errors.description = "Description must be a string";
        } else {
            sanitized.description = req.body.description.trim();
        }
    }

    if (Object.hasOwn(req.body, "completed")) {
        if (typeof req.body.completed !== "boolean") {
            errors.completed = "Completed must be a boolean";
        } else {
            sanitized.completed = req.body.completed;
        }
    }

    if (Object.hasOwn(req.body, "priority")) {
        if (!["low", "medium", "high"].includes(req.body.priority)) {
            errors.priority = "Priority must be low, medium, or high";
        } else {
            sanitized.priority = req.body.priority;
        }
    }

    if (isUpdate && Object.keys(sanitized).length === 0 && Object.keys(errors).length === 0) {
        errors.body = "At least one task field is required";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    req.body = sanitized;
    return next();
}

module.exports = {
    validateCredentials,
    validateTask
};
