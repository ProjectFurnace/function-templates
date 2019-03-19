const index = require(".");

describe('fp', () => {
  const { fp } = index;

  it('pipe function should exist', () => {
    expect(fp.pipe).toBeInstanceOf(Function);
  });

  it('tryCatch function should exist', () => {
    expect(fp.tryCatch).toBeInstanceOf(Function);
  });

  it('curry function should exist', () => {
    expect(fp.curry).toBeInstanceOf(Function);
  });
});