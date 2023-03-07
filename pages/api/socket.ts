import type { Server as HTTPServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Socket as NetSocket } from "net";
import { Server as IOServer } from "socket.io";
import DroneData from "@/models/DroneData";
import { getActiveDronesInBounds, putDroneData } from "@/utils/DynamoDbDrones";
import ExpandedBounds from "@/models/ExpandedBounds";

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
      socket.on("get-drones", async (bounds: ExpandedBounds | null) => {
        const drones = await getActiveDronesInBounds(bounds);
        console.log(JSON.stringify(drones));
        socket.emit("list", drones);
      });
      socket.on("update", (drones: DroneData[]) => {
        drones.forEach(putDroneData);
      });
    });
  }
  res.end();
};

export default SocketHandler;
