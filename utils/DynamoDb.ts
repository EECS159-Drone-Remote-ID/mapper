import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbConfig = {
  credentials: {
    accessKeyId: process.env.DDB_AWS_ACCESS_KEY_ID ?? "fakeAccessKeyId",
    secretAccessKey:
      process.env.DDB_AWS_SECRET_ACCESS_KEY ?? "fakeSecretAccessKey",
  },
  region: process.env.DDB_AWS_REGION ?? "us-west-2",
  endpoint: process.env.DDB_ENDPOINT ?? "http://db:8000",
};

export const ddbClient = new DynamoDBClient(ddbConfig);
