import { Server } from "socket.io";
let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("join-admin", (adminId) => {
            socket.join(adminId);
            console.log("Admin joined:", adminId);
        });
        
        socket.on("join-admin", (adminId) => {
            socket.join(adminId);

            console.log("Admin joined:", adminId);
            console.log("Rooms:", socket.rooms);
        });
        socket.on("join-customer", (customerId) => {
            socket.join(`customer-${customerId}`);
            console.log("Customer joined:", customerId);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket not initialized");
    }
    return io;
};
