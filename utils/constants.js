export const ORDER_STATUS = Object.freeze({
    PENDING: "pending",
    PREPARING: "preparing",
    SERVED: "served",
});
export const ROLES = {
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
};

export const RECIPIENT_TYPES = {
    ADMIN: "admin",
    CUSTOMER: "customer",
    ROLE: "role",
};
export const NOTIFICATION_TYPES = {
    DEMO_REQUEST_CREATED: "demo_request_created",
    CUSTOMER_CREATED: "customer_created",
    ORDER_CREATED: "order_created",
    ORDER_STATUS_UPDATED: "order_status_updated",
    ORDER_ITEM_STATUS_UPDATED: "order_item_status_updated",
    TICKET_RAISED: "ticket_raised",
    TICKET_STATUS_UPDATED: "ticket_status_updated",
    SUBSCRIPTION_EXPIRED: "subscription_expired",
    SUBSCRIPTION_EXPIRING_SOON: "subscription_expiring_soon",
    TABLE_CHANGED: "table_changed",
};
export const ENTITY_TYPES = {
    ORDER: "order",
    CUSTOMER: "customer",
    TICKET: "ticket",
    DEMO_REQUEST: "demo_request",
    SUBSCRIPTION: "subscription",
};
export const ISSUE_STATUSES = {
    PENDING: "pending",
    IN_PROCESS: "in_process",
    RESOLVED: "resolved",
};
export const GST_TYPES = {
  INCLUSIVE: "inclusive",
  EXCLUSIVE: "exclusive",
};

export const ORDER_TYPES = {
    DINE_IN: "DINE_IN",
    PARCEL: "PARCEL",
};

export const CATEGORY_TYPES = {
    MENU: "menu",
    INVENTORY: "inventory",
};
