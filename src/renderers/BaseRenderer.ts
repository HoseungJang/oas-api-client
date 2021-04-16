import * as prettier from "prettier";

export class BaseRenderer {
  private readonly formatOptions: prettier.Options;

  constructor(formatOptions?: prettier.Options) {
    this.formatOptions = {
      semi: true,
      parser: "babel-ts",
      ...formatOptions,
    };
  }

  protected format(code: string) {
    return prettier.format(code);
  }
}
