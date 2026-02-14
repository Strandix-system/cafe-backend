export const parseJSONFields = (fields = []) => (req, res, next) => {
  fields.forEach((field) => {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        return res.status(400).json({ message: `Invalid ${field} format` });
      }
    }
  });
  next();
};