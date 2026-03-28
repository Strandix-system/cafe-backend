import { issueService } from './service.js';
import { sendSuccessResponse } from '../../utils/response.js';
import { pick } from '../../utils/pick.js';
import { ApiError } from '../../utils/apiError.js';

export const issueController = {
  raiseTicket: async (req, res) => {
    if (req.files && req.files.length > 3) {
      throw new ApiError(400, 'Maximum 3 images are allowed');
    }
    const data = await issueService.raiseTicket(
      req.body,
      req.user._id,
      req.files,
    );
    sendSuccessResponse(res, 201, 'Ticket raised successfully', data);
  },
  getTickets: async (req, res) => {
    const filter = pick(req.query, ['search', 'status', 'ticketId', 'adminId']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    if (req.user.role === 'admin') {
      filter.adminId = req.user._id;
    }
    const data = await issueService.getTickets(filter, options);
    sendSuccessResponse(res, 200, 'Tickets fetched', data);
  },
  updateStatus: async (req, res) => {
    const { ticketId } = req.params;
    const { status } = req.body;
    const data = await issueService.updateStatus(ticketId, status);
    sendSuccessResponse(res, 200, 'Status updated', data);
  },
};
