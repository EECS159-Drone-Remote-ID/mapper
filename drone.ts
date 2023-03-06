import express from "express";
import DroneData from ".";

type RemoteIDPayload = {
  messageType: "registration" | "heartbeat" | "location" | "status";
  operatorId: string;
  droneId: string;
  droneType: string;
  maxAltitude: number;
  maxDistance: number;
  payloadWeight: number;
  takeoffWeight: number;
  speed: number;
  callSign: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  position?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  heading?: number;
  timestamp?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Drone = {
  id: string;
  location: Coordinates;
};

function initializeDrones(): Drone[] {
  const drones: Drone[] = [];
  const irvineCoords: Coordinates = {
    latitude: 33.6846,
    longitude: -117.8265,
  };
  const distanceInMiles = 0.5;
  const distanceInMeters = distanceInMiles * 1609.34;

  for (let i = 1; i <= 3; i++) {
    const id = `Drone${i}`;
    const latitude = irvineCoords.latitude + getRandomOffset(distanceInMeters);
    const longitude =
      irvineCoords.longitude + getRandomOffset(distanceInMeters);
    const location: Coordinates = { latitude, longitude };
    drones.push({ id, location });
  }

  return drones;
}

function getRandomOffset(maxDistance: number): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const offset = Math.random() * maxDistance * sign;
  return offset / 111000; // Convert meters to degrees (approximately)
}

function updateDroneLocations(drones: Drone[]): void {
  setInterval(() => {
    drones.forEach((drone) => {
      const maxDistanceInMeters = 804.672; // Half a mile in meters
      const maxOffsetInDegrees = maxDistanceInMeters / 111000; // Convert meters to degrees (approximately)
      const latitude =
        drone.location.latitude + getRandomOffset(maxOffsetInDegrees);
      const longitude =
        drone.location.longitude + getRandomOffset(maxOffsetInDegrees);
      drone.location = { latitude, longitude };
      console.log(`Drone ${drone.id} location updated:`, drone.location);
    });
  }, 1 * 60 * 1000); // 1 minutes in milliseconds
}

// Usage
const drones = initializeDrones();
console.log(
  "Initial drone locations:",
  drones.map((drone) => drone.location)
);
updateDroneLocations(drones);

const app = express();

// Routes
app.get("/", (req, res) => {
  res.send("Connecting to the Drone API!");
});

app.get("/next-location", (req, res) => {
  res.send(drones);
});

// Start the server
const PORT = process.env.PORT || 9567;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export {};
