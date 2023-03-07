import express from "express";
import { LocationVector, DroneData, BasicId } from "@/models/DroneData";

function initializeDrones(): DroneData[] {
  const drones: DroneData[] = [];
  const irvineCoords: LocationVector = {
    latitude: 33.6846,
    longitude: -117.8265,
  };
  const distanceInMiles = 0.5;
  const distanceInMeters = distanceInMiles * 1609.34;

  for (let i = 1; i <= 3; i++) {
    const id = i;
    const latitude = irvineCoords.latitude + getRandomOffset(distanceInMeters);
    const longitude =
      irvineCoords.longitude + getRandomOffset(distanceInMeters);
    const location: LocationVector = { latitude, longitude };
    const basicId: BasicId = {
      idType: 1,
      uaType: 2,
      uasId: id.toString(),
    };

    const drone: DroneData = {
      basicId: basicId,
      locationVector: location,
      lastUpdate: new Date().getUTCDate(),
    };

    drones.push(drone);
  }

  return drones;
}

function getRandomOffset(maxDistance: number): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const offset = Math.random() * maxDistance * sign;
  return offset / 111000; // Convert meters to degrees (approximately)
}

function updateDroneLocations(drones: DroneData[]): void {
  setInterval(() => {
    drones.forEach((drone) => {
      const maxDistanceInMeters = 804.672; // Half a mile in meters
      const maxOffsetInDegrees = maxDistanceInMeters / 111000; // Convert meters to degrees (approximately)
      const latitude =
        drone.locationVector.latitude + getRandomOffset(maxOffsetInDegrees);
      const longitude =
        drone.locationVector.longitude + getRandomOffset(maxOffsetInDegrees);
      drone.locationVector = { latitude, longitude };
      console.log(
        "Drone ${drone.basicId.uasId} location updated:",
        drone.locationVector
      );
    });
  }, 1 * 60 * 1000); // 1 minutes in milliseconds
}

// Usage
const drones = initializeDrones();
console.log(
  "Initial drone locations:",
  drones.map((drone) => drone.locationVector)
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
