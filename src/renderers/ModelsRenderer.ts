import { SchemasObject } from "openapi3-ts";
import * as _ from "lodash";
import * as traverse from "traverse";
import { compile } from "json-schema-to-typescript";

import { BaseRenderer } from "./BaseRenderer";

export class ModelsRenderer extends BaseRenderer {
  private readonly schemas: SchemasObject;

  constructor(schemas: SchemasObject) {
    super();

    this.schemas = traverse(schemas).map(function (schema) {
      // set additionalProperties option to prevent generating '[k: string]: unknown' from json-schema-to-typescript
      if (schema?.type === "object") {
        this.update({
          ...schema,
          additionalProperties: false,
        });
      }
    });
  }

  public async render() {
    const schemaPairs = _.chain(this.schemas).toPairs().value();

    const models = await Promise.all(
      schemaPairs.map(async ([name, schema]) => {
        const updatedSchema = traverse(schema).map(function (value) {
          if (value?.$ref) {
            const splitedRef = (value.$ref as string).split("/");
            const schemaName = splitedRef[splitedRef.length - 1];
            this.update({
              ...schemaPairs.find(([name]) => name === schemaName)![1],
            });
          }
        });

        return await compile(updatedSchema, name, { bannerComment: "" });
      })
    );

    return this.format(models.join("\n"));
  }
}
