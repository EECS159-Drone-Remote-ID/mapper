import { BasicId, DroneData, DroneDataDdb } from "@/models/DroneData";
import {
  AttributeValue,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./DynamoDb";

const DEFAULT_TTL = 5 * 60 * 1000;

export async function getActiveDrones() {
  const tMinusTtl = Date.now() - DEFAULT_TTL;
  const activeDrones = await ddbClient.send(
    new ScanCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      IndexName: process.env.INDEX_NAME_DRONES_TIME,
      ScanFilter: {
        lastUpdate: {
          AttributeValueList: [{ N: tMinusTtl.toString() }],
          ComparisonOperator: "GE",
        },
      },
    })
  );
  return activeDrones.Items?.map((element: Record<string, AttributeValue>) => {
    ddbToDroneData(element);
  });
}

export async function putDroneData(droneData: DroneData) {
  const latestSession = await getLatestSession(
    basicIdToUasIdString(droneData.basicId)
  );
  const tMinusTtl = Date.now() - DEFAULT_TTL;
  let nextSession: number;
  if (latestSession?.session?.N == null) {
    nextSession = 1;
  } else if (
    latestSession?.lastUpdate?.N != null &&
    parseInt(latestSession?.lastUpdate?.N) >= tMinusTtl
  ) {
    nextSession = parseInt(latestSession.session.N);
  } else {
    nextSession = parseInt(latestSession.session.N) + 1;
  }
  await ddbClient.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      Item: droneDataToDdbWithSession(droneData, nextSession),
    })
  );
}

async function getLatestSession(uasIdString: string) {
  const latestSession = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      KeyConditions: {
        uasId: {
          ComparisonOperator: "EQ",
          AttributeValueList: [{ S: uasIdString }],
        },
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );
  const item = latestSession.Items?.at(0);
  return item != undefined
    ? { session: item.session, lastUpdate: item.lastUpdate }
    : null;
}

function droneDataToDdb(droneData: DroneData) {
  const ddbData: DroneDataDdb = {
    uasId: basicIdToUasIdString(droneData.basicId),
    lastUpdate: droneData.lastUpdate,
    ...droneData.locationVector,
  };
  return marshall(ddbData);
}

function droneDataToDdbWithSession(droneData: DroneData, session: number) {
  const marshalled = droneDataToDdb(droneData);
  marshalled["session"] = { N: session.toString() };
  return marshalled;
}

function ddbToDroneData(ddbItem: Record<string, AttributeValue>): DroneData {
  const { uasId, lastUpdate, ...locationVector } = unmarshall(
    ddbItem
  ) as DroneDataDdb;
  return {
    basicId: uasIdStringToBasicId(uasId),
    locationVector: locationVector,
    lastUpdate: lastUpdate,
  };
}

function uasIdStringToBasicId(uasIdString: string): BasicId {
  const splitString = uasIdString.split("#");
  return {
    idType: parseInt(splitString[0]),
    uaType: parseInt(splitString[1]),
    uasId: splitString[2],
  };
}

export function basicIdToUasIdString(basicId: BasicId) {
  return `${basicId.idType}#${basicId.uaType}#${basicId.uasId}`;
}
