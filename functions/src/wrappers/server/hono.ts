import * as functions from "firebase-functions/v2";
import * as hono from "../../functions/server/hono";

export default functions.https.onRequest(
  {
    region: "asia-northeast1",
    maxInstances: 5,
    timeoutSeconds: 10,
    memory: "1GiB",
  },
  hono.server,
);
