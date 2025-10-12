const { ZodError } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    try {
      // parse throws if invalid; we replace req.body with the validated data
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: e.flatten(), // nice, structured errors
        });
      }
      next(e);
    }
  };
}

module.exports = { validate };
