// This file contains code that we reuse between our tests.
const helper = require("fastify-cli/helper.js");
import * as path from "path";
import * as tap from "tap";
import t from "tap";
import sinon from "sinon";
import { generateDbClient } from "../src/lib/db";
import * as verificationClient from "../src/lib/auth";

export type Test = (typeof tap)["Test"]["prototype"];

const AppPath = path.join(__dirname, "..", "src", "app.ts");

// Fill in this config with all the configurations
// needed for testing the application
// @ts-ignore
async function config(db, queryClient) {
  return {
    db,
    queryClient,
  };
}

//@ts-ignore
let sendCodeStub;
// @ts-ignore
let checkCodeStub;
t.before(() => {
  // @ts-ignore
  if (!global.database && !global.queryClient) {
    const { db, queryClient } = generateDbClient();
    // @ts-ignore
    global.database = db;
    // @ts-ignore
    global.queryClient = queryClient;
  }

  sendCodeStub = sinon.stub(verificationClient, "sendVerificationCode");
  checkCodeStub = sinon.stub(verificationClient, "checkVerificationCode");
  // @ts-ignore
  sendCodeStub.returns(Promise.resolve({ success: true }));
  // @ts-ignore
  checkCodeStub.returns(Promise.resolve({ success: true }));
});

t.teardown(() => {
  // @ts-ignore
  sendCodeStub.restore();
  // @ts-ignore
  checkCodeStub.restore();

  // @ts-ignore
  global.queryClient?.end();
});

// Automatically build and tear down our instance
async function build(t: Test) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  // @ts-ignore
  const app = await helper.build(
    argv,
    await config(global.database, global.queryClient),
  );

  // Tear down our app after we are done
  t.teardown(() => {
    void app.close();
  });

  return app;
}

export { config, build };
