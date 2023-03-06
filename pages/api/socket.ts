import type { Server as HTTPServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Socket as NetSocket } from "net";
import { Server as IOServer } from "socket.io";
import { DroneData } from "@/models/DroneData";
import { getActiveDrones, putDroneData } from "@/utils/DynamoDbDrones";

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", async (socket) => {
      socket.emit("init-map", await getActiveDrones());
      socket.on("update", (drones: DroneData[]) => {
        drones.forEach(putDroneData);
      });
    });
  }
};

export default SocketHandler;
