const { Server } = require("socket.io");
const { registerDomainEventRouter } = require("./event-router");
const { logger } = require("../common/logger");
const { markRealtimeInitialized, setRealtimeConnectedClients } = require("../app/runtime-state");

const parseIdentity = (socket) => {
  const auth = socket.handshake?.auth || {};
  const query = socket.handshake?.query || {};
  return {
    userId: auth.userId || query.userId || null,
    ownerId: auth.ownerId || query.ownerId || null,
    branchId: auth.branchId || query.branchId || null,
    role: auth.role || query.role || null,
  };
};

const createRealtimeServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  markRealtimeInitialized();
  setRealtimeConnectedClients(0);

  const detachDomainRouter = registerDomainEventRouter(io);

  io.on("connection", (socket) => {
    setRealtimeConnectedClients(io.of("/").sockets.size);

    const { userId, ownerId, branchId, role } = parseIdentity(socket);
    const joinedRooms = new Set();

    const joinRoom = (room) => {
      if (!room || joinedRooms.has(room)) return;
      socket.join(room);
      joinedRooms.add(room);
    };

    if (userId) joinRoom(`driver:${String(userId)}`);
    if (ownerId) joinRoom(`owner:${String(ownerId)}`);
    if (branchId) joinRoom(`attendant:${String(branchId)}`);
    if (role === "admin") joinRoom("admin:global");

    logger.info("Socket connected", {
      module: "realtime.socket-server",
      socketId: socket.id,
      userId: userId ? String(userId) : null,
      ownerId: ownerId ? String(ownerId) : null,
      branchId: branchId ? String(branchId) : null,
      role: role || null,
      joinedRooms: Array.from(joinedRooms),
    });

    socket.on("disconnect", (reason) => {
      setRealtimeConnectedClients(io.of("/").sockets.size);
      logger.info("Socket disconnected", {
        module: "realtime.socket-server",
        socketId: socket.id,
        reason,
      });
    });

    socket.on("error", (error) => {
      logger.warn("Socket error", {
        module: "realtime.socket-server",
        socketId: socket.id,
        error,
      });
    });
  });

  return {
    io,
    close: async () => {
      detachDomainRouter();
      await io.close();
    },
  };
};

module.exports = {
  createRealtimeServer,
};
