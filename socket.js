import { Server } from 'socket.io';
let io;

const socketRooms = {
  user: (userId) => `user:${userId}`,
  admin: (adminId) => `admin:${adminId}`,
  customer: (customerId) => `customer:${customerId}`,
  role: (role) => `role:${role}`,
};

const joinRooms = (socket, rooms = []) => {
  rooms.filter(Boolean).forEach((room) => socket.join(room));
};

const emitToRooms = (rooms, event, payload) => {
  const uniqueRooms = [...new Set(rooms.filter(Boolean))];

  if (!uniqueRooms.length) {
    return;
  }

  let broadcaster = getIO();

  uniqueRooms.forEach((room) => {
    broadcaster = broadcaster.to(room);
  });

  broadcaster.emit(event, payload);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join-admin', (adminId) => {
      if (!adminId) {
        return;
      }

      joinRooms(socket, [
        adminId,
        socketRooms.user(adminId),
        socketRooms.admin(adminId),
      ]);
      console.log('Admin joined:', adminId);
    });

    socket.on('join-superadmin', (userId) => {
      if (!userId) {
        return;
      }

      joinRooms(socket, [
        userId,
        socketRooms.user(userId),
        socketRooms.role('superadmin'),
      ]);
      console.log('Superadmin joined:', userId);
    });

    socket.on('join-user', ({ userId, role } = {}) => {
      if (!userId) {
        return;
      }

      const rooms = [userId, socketRooms.user(userId)];

      if (role === 'admin') {
        rooms.push(socketRooms.admin(userId));
      }

      if (role === 'superadmin') {
        rooms.push(socketRooms.role('superadmin'));
      }

      joinRooms(socket, rooms);
      console.log('User joined:', userId);
    });

    socket.on('join-customer', (customerId) => {
      if (!customerId) {
        return;
      }

      joinRooms(socket, [
        `customer-${customerId}`,
        socketRooms.customer(customerId),
      ]);
      console.log('Customer joined:', customerId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket not initialized');
  }
  return io;
};

const emitNotificationToUser = (userId, payload) => {
  const id = userId?.toString();
  if (!id) {
    return;
  }

  emitToRooms(
    [id, socketRooms.user(id), socketRooms.admin(id)],
    'notification:new',
    payload,
  );
};

const emitNotificationToCustomer = (customerId, payload) => {
  const id = customerId?.toString();
  if (!id) {
    return;
  }

  emitToRooms(
    [`customer-${id}`, socketRooms.customer(id)],
    'notification:new',
    payload,
  );
};

export {
  socketRooms,
  initSocket,
  getIO,
  emitNotificationToUser,
  emitNotificationToCustomer,
};
