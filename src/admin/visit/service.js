import Visit from "../../../model/visit.js";

const visitService = {
  trackVisit: async (req) => {
    const visit = await Visit.create({
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return visit;
  },

  getTotalVisits: async () => {
    const total = await Visit.countDocuments();
    return total;
  },
};

export default visitService;