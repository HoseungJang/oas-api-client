import { OpenAPIObject } from "openapi3-ts";
import * as _ from "lodash";
import * as fs from "fs/promises";

import { ModelsRenderer } from "./ModelsRenderer";
import { OperationExtractor } from "./OperationExtractor";

export class ClientGenerator {
  constructor(
    private readonly APIDefinition: OpenAPIObject,
    private readonly outputDir: string
  ) {}

  public async generate() {
    const operations = await new OperationExtractor(
      this.APIDefinition.paths
    ).extract();

    const models = await new ModelsRenderer({
      ...(this.APIDefinition.components?.schemas ?? {}),
      ..._.chain(operations)
        .map(
          ({
            requestSchema,
            requestModelName,
            responseSchema,
            responseModelName,
          }) => [
            [requestModelName, requestSchema],
            [responseModelName, responseSchema],
          ]
        )
        .flatMap((pairs) => pairs)
        .fromPairs()
        .value(),
    }).render();

    await fs.writeFile(`${this.outputDir}/models.ts`, models);
  }
}
