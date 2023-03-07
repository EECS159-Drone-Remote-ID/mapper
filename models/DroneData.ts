import { IDType } from "./IDType";
import { UAType } from "./UAType";

export default interface DroneData {
  basicId: BasicId;
  locationVector: LocationVector;
  lastUpdate: number;
}

export interface BasicId {
  idType: IDType;
  uaType: UAType;
  uasId: string;
}

export interface LocationVector {
  latitude: number;
  longitude: number;
}

export interface DroneDataDdb extends LocationVector {
  uasId: string;
  lastUpdate: number;
  latest: number;
}
