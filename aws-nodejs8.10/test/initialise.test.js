const initialise = require("../processors/lib/initialise");

describe("processEvent", () => {
  it("should work", async () => {
    process.env.LOGIC_PATH = __dirname + "/fixtures/testfunction/index";

    const result = await initialise.processEvent({ hello: "world" });

    console.log(result);
  });
});
