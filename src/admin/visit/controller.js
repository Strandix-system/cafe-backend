import { sendSuccessResponse } from '../../../utils/response.js';

import visitService from './service.js';

const visitController = {
  trackVisit: async (req, res) => {
    await visitService.trackVisit(req);
    sendSuccessResponse(res, 200, 'Visit tracked successfully');
  },

  getTotalVisits: async (req, res) => {
    const total = await visitService.getTotalVisits();
    sendSuccessResponse(res, 200, 'Total visits fetched', {
      totalVisits: total,
    });
  },
};

export default visitController;
