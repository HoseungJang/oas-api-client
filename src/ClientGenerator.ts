import { OpenAPIObject } from "openapi3-ts";
import * as _ from "lodash";
import * as fs from "fs/promises";
import * as prettier from "prettier";

import { OperationExtractor } from "./OperationExtractor";
import { ClientRenderer } from "./renderers/ClientRenderer";
import { ModelsRenderer } from "./renderers/ModelsRenderer";

export class ClientGenerator {
  constructor(
    private readonly APIDefinition: OpenAPIObject,
    private readonly outputDir: string
  ) {}

  public async generate() {
    const operations = await new OperationExtractor(
      this.APIDefinition.paths
    ).extract();

    const client = await new ClientRenderer(operations).render();
    const models = await new ModelsRenderer({
      ...(this.APIDefinition.components?.schemas ?? {}),
      ..._.chain(operations)
        .map(
          ({
            requestModelName,
            requestSchema,
            responseModelName,
            responseSchema,
          }) => [
            [requestModelName, requestSchema],
            [responseModelName, responseSchema],
          ]
        )
        .flatMap((pairs) => pairs)
        .fromPairs()
        .value(),
    }).render();

    await fs.writeFile(`${this.outputDir}/client.ts`, client);
    await fs.writeFile(`${this.outputDir}/models.ts`, models);
    await fs.writeFile(
      `${this.outputDir}/index.ts`,
      prettier.format(
        `
          export { Client } from "./client";
          export * as Models from "./models";
        `,
        { semi: true, parser: "babel-ts" }
      )
    );
  }
}
