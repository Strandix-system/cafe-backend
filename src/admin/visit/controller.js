import visitService from "./service.js";

const visitController = {
  trackVisit: async (req, res) => {
    try {
      await visitService.trackVisit(req);

      res.status(200).json({
        success: true,
        message: "Visit tracked successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getTotalVisits: async (req, res) => {
    try {
      const total = await visitService.getTotalVisits();

      res.status(200).json({
        success: true,
        totalVisits: total,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default visitController;