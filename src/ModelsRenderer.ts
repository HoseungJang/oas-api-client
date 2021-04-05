import { SchemasObject } from "openapi3-ts";
import * as _ from "lodash";
import * as traverse from "traverse";
import { compile } from "json-schema-to-typescript";

export class ModelsRenderer {
  private readonly schemas: SchemasObject;

  constructor(schemas: SchemasObject) {
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
    const getSchemaByName = (name: string) => {
      return this.schemas[name];
    };

    const schemaPairs = _.chain(this.schemas).toPairs().value();

    const models = await Promise.all(
      schemaPairs.map(async ([name, schema]) => {
        const mappedSchema = traverse(schema).map(function (value) {
          if (value?.$ref) {
            const splitedRef = (value.$ref as string).split("/");
            const schemaName = splitedRef[splitedRef.length - 1];
            this.update(getSchemaByName(schemaName));
          }
        });

        return await compile(mappedSchema, name, { bannerComment: "" });
      })
    );

    return models.join("\n");
  }
}
