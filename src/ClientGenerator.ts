import { OpenAPIObject } from "openapi3-ts";
import * as _ from "lodash";
import * as fs from "fs/promises";

import { OperationExtractor } from "./OperationExtractor";
import { ClientRenderer } from "./renderers/ClientRenderer";
import { ModelsRenderer } from "./renderers/ModelsRenderer";

export class ClientGenerator {
  constructor(
    private readonly APIDefinition: OpenAPIObject,
    private readonly outputDir: string
  ) {}

  public async generate() {
    const operationExtractor = new OperationExtractor(this.APIDefinition.paths);
    const operations = await operationExtractor.extract();

    const clientRenderer = new ClientRenderer(operations);
    const entry = clientRenderer.renderEntry();
    const client = await clientRenderer.render();

    const modelsRenderer = new ModelsRenderer({
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
    });
    const models = await modelsRenderer.render();


    await fs.writeFile(`${this.outputDir}/index.ts`, entry);
    await fs.writeFile(`${this.outputDir}/client.ts`, client);
    await fs.writeFile(`${this.outputDir}/models.ts`, models);
  }
}
