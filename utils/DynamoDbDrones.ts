import DroneData, { BasicId, DroneDataDdb } from "@/models/DroneData";
import ExpandedBounds from "@/models/ExpandedBounds";
import {
  AttributeValue,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./DynamoDb";

const DEFAULT_TTL = 60 * 60;

export async function getActiveDronesInBounds(
  bounds: ExpandedBounds | null
): Promise<DroneData[]> {
  const tMinusTtl = Math.round(Date.now() / 1000) - DEFAULT_TTL;
  if (bounds != null) {
    console.log(JSON.stringify(bounds));
    const activeDrones = await ddbClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME_DRONES,
        IndexName: process.env.INDEX_NAME_DRONES_LATEST,
        FilterExpression:
          "latest = :latest AND lastUpdate >= :tMinusTtl AND (latitude BETWEEN :latS and :latN) AND (longitude BETWEEN :lngW and :lngE)",
        ExpressionAttributeValues: {
          ":latest": { N: "1" },
          ":tMinusTtl": { N: tMinusTtl.toString() },
          ":latN": { N: bounds.latN.toString() },
          ":latS": { N: bounds.latS.toString() },
          ":lngE": { N: bounds.lngE.toString() },
          ":lngW": { N: bounds.lngW.toString() },
        },
      })
    );
    return activeDrones.Items
      ? activeDrones.Items.map((element: Record<string, AttributeValue>) =>
          ddbToDroneData(element)
        )
      : [];
  } else {
    return [];
  }
}

export async function getActiveDrones(): Promise<DroneData[]> {
  const tMinusTtl = Math.round(Date.now() / 1000) - DEFAULT_TTL;
  const activeDrones = await ddbClient.send(
    new ScanCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      IndexName: process.env.INDEX_NAME_DRONES_LATEST,
      FilterExpression: "latest = :latest AND lastUpdate >= :tMinusTtl",
      ExpressionAttributeValues: {
        ":latest": { N: "1" },
        ":tMinusTtl": { N: tMinusTtl.toString() },
      },
    })
  );
  return activeDrones.Items
    ? activeDrones.Items.map((element: Record<string, AttributeValue>) =>
        ddbToDroneData(element)
      )
    : [];
}

export async function putDroneData(droneData: DroneData) {
  const latest = await getLatest(basicIdToUasIdString(droneData.basicId));
  console.log(JSON.stringify(latest));
  if (latest != null) {
    await ddbClient.send(
      new UpdateItemCommand({
        TableName: process.env.TABLE_NAME_DRONES,
        Key: {
          uasId: { S: basicIdToUasIdString(droneData.basicId) },
          lastUpdate: { N: latest.lastUpdate.toString() },
        },
        UpdateExpression: "SET latest = :latest",
        ExpressionAttributeValues: {
          ":latest": { N: "0" },
        },
      })
    );
  }
  await ddbClient.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      Item: droneDataToDdb(droneData),
    })
  );
  await ddbClient.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      Key: {
        uasId: { S: basicIdToUasIdString(droneData.basicId) },
        lastUpdate: { N: droneData.lastUpdate.toString() },
      },
      UpdateExpression: "SET latest = :latest",
      ExpressionAttributeValues: {
        ":latest": { N: "1" },
      },
    })
  );
}

async function getLatest(uasIdString: string) {
  const latestSession = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME_DRONES,
      KeyConditionExpression: "uasId = :uasIdString",
      FilterExpression: "latest = :latest",
      ExpressionAttributeValues: {
        ":uasIdString": { S: uasIdString },
        ":latest": { N: "1" },
      },
      Limit: 1,
      ScanIndexForward: false,
    })
  );
  const item = latestSession.Items?.at(0);
  console.log(JSON.stringify(latestSession));
  return item ? ddbToDroneData(item) : null;
}

function droneDataToDdb(droneData: DroneData) {
  const ddbData: DroneDataDdb = {
    uasId: basicIdToUasIdString(droneData.basicId),
    lastUpdate: droneData.lastUpdate,
    latest: 1,
    ...droneData.locationVector,
  };
  return marshall(ddbData);
}

function ddbToDroneData(ddbItem: Record<string, AttributeValue>): DroneData {
  const { uasId, latest, lastUpdate, ...locationVector } = unmarshall(
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
