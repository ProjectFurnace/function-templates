const handler = require("../handler");

describe("handler", () => {
  it("should return", async () => {
    process.env.LOGIC_PATH = __dirname + "/fixtures/testfunction/index";

    const result = await handler.handler(
      {
        Records: [{ hello: "world" }],
      },
      { fake: "context" }
    );

    console.log(result);
  });
});
