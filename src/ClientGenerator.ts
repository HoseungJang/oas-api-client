import { OpenAPIObject } from "openapi3-ts";
import * as fs from "fs/promises";

import { ModelsRenderer } from "./ModelsRenderer";

export class ClientGenerator {
  private readonly APIDefinition: OpenAPIObject;
  private readonly outputDir: string;

  constructor(options: { APIDefinition: OpenAPIObject; outputDir: string }) {
    this.APIDefinition = options.APIDefinition;
    this.outputDir = options.outputDir;
  }

  public async generate() {
    const models = await new ModelsRenderer(
      this.APIDefinition.components!.schemas!
    ).render();

    await fs.writeFile(`${this.outputDir}/models.ts`, models);
  }
}
