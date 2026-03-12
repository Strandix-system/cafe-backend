import crypto from "crypto";

export const generateTicketId = () =>
    `TKT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;