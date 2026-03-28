import { IssueReported } from '../../model/issueReported.js';
import User from '../../model/user.js';
import { generateTicketId } from '../../utils/utils.js';
import { ApiError } from '../../utils/apiError.js';
import {
  ENTITY_TYPES,
  ISSUE_STATUSES,
  NOTIFICATION_TYPES,
  RECIPIENT_TYPES,
} from '../../utils/constants.js';
import { notificationService } from '../notification/notification.service.js';

export const issueService = {
  raiseTicket: async (data, adminId, files = []) => {
    const images = files.map((file) => file?.location).slice(0, 3);

    const ticket = await IssueReported.create({
      ...data,
      images,
      adminId,
      ticketId: generateTicketId(),
      status: ISSUE_STATUSES.PENDING,
    });

    const admin = await User.findById(adminId).select(
      'firstName lastName cafeName',
    );
    const adminLabel =
      `${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() ||
      admin?.cafeName ||
      'an admin';

    await notificationService.createNotification({
      title: 'New support ticket',
      message: `A new ticket ${ticket.ticketId} has been raised by ${adminLabel}.`,
      notificationType: NOTIFICATION_TYPES.TICKET_RAISED,
      recipientType: RECIPIENT_TYPES.ROLE,
      recipientRole: 'superadmin',
      adminId,
      entityType: ENTITY_TYPES.TICKET,
      entityId: ticket._id,
    });

    return ticket;
  },
  getTickets: async (filter, options) => {
    if (filter.search) {
      filter.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { ticketId: { $regex: filter.search, $options: 'i' } },
      ];
      delete filter.search;
    }

    return await IssueReported.paginate(filter, options);
  },
  updateStatus: async (ticketId, status) => {
    const ticket = await IssueReported.findOneAndUpdate(
      { ticketId },
      { status },
      { new: true },
    );

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    await notificationService.createNotification({
      title: 'Ticket status updated',
      message: `Your ticket ${ticket.ticketId} status is now ${status}.`,
      notificationType: NOTIFICATION_TYPES.TICKET_STATUS_UPDATED,
      recipientType: RECIPIENT_TYPES.ADMIN,
      userId: ticket.adminId,
      adminId: ticket.adminId,
      entityType: ENTITY_TYPES.TICKET,
      entityId: ticket._id,
    });

    return ticket;
  },
};
