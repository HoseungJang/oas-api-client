import * as _ from "lodash";

import {
  PathsObject,
  ParameterObject,
  RequestBodyObject,
  OperationObject,
  SchemaObject,
  ResponsesObject,
  ResponseObject,
} from "openapi3-ts";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Operation {
  id: string;
  path: string;
  method: RequestMethod;
  parameters: {
    path: string[];
    query: string[];
    body: string[];
  };
  requestSchema: SchemaObject;
  responseSchema: SchemaObject;
  requestModelName: string;
  responseModelName: string;
}

export class OperationExtractor {
  constructor(private readonly paths: PathsObject) {}

  public async extract() {
    const pathOperations = _.chain(this.paths)
      .toPairs()
      .map(([path, operations]) => ({
        path,
        operations: _.toPairs(operations).map(([method, operation]) => ({
          method: method.toUpperCase() as RequestMethod,
          operation: operation as OperationObject,
        })),
      }))
      .value();

    const result: Operation[] = [];

    pathOperations.forEach(({ path, operations }) => {
      operations.forEach(({ method, operation }) => {
        if (!operation.operationId) {
          throw new Error("operationId must be provided for each operation");
        }

        const capitalizedOperationId =
          operation.operationId!.charAt(0).toUpperCase() +
          operation.operationId!.slice(1);
        const { parameters, requestSchema } = this.extractParameters(operation);
        const responseSchema = this.extractResponseSchema(operation.responses);

        result.push({
          id: operation.operationId!,
          path,
          method,
          parameters,
          requestSchema,
          responseSchema,
          requestModelName: `${capitalizedOperationId}RequestParameter`,
          responseModelName: `${capitalizedOperationId}Response`,
        });
      });
    });

    return result;
  }

  private extractParameters(operation: OperationObject) {
    const parameters: Operation["parameters"] = {
      path: [],
      query: [],
      body: [],
    };

    const requestSchema: SchemaObject = {
      type: "object",
      properties: {},
      required: [],
    };

    if (operation.parameters) {
      (operation.parameters as ParameterObject[]).forEach((parameter) => {
        if (!parameter.schema) {
          throw new Error("schema of parameters must be provided");
        } else if (parameter.schema.$ref) {
          throw new Error("do not use $ref in parameters");
        }

        requestSchema.properties![parameter.name] = parameter.schema!;

        if (parameter.required) {
          requestSchema.required!.push(parameter.name);
        }

        switch (parameter.in) {
          case "path": {
            parameters.path.push(parameter.name);
            break;
          }
          case "query": {
            parameters.query.push(parameter.name);
            break;
          }
          default: {
            throw new Error(
              "value of parameter.in is one of 'path' or 'query'"
            );
          }
        }
      });
    }

    if (operation.requestBody) {
      const requestBodyContent = (operation.requestBody as RequestBodyObject)
        .content["application/json"];

      if (!requestBodyContent) {
        throw new Error(
          "currently supported content type is only 'application/json'"
        );
      } else if (!requestBodyContent.schema) {
        throw new Error("schema of request body is must be provided");
      } else if (requestBodyContent.schema.$ref) {
        throw new Error("do not use $ref in request body");
      }

      const requestBodySchema = requestBodyContent.schema as SchemaObject;

      const requestBodyPropertyPairs = _.toPairs(requestBodySchema.properties);

      requestBodyPropertyPairs.map(([name, schema]) => {
        parameters.body.push(name);
        requestSchema.properties![name] = schema!;
      });

      requestSchema.required = [
        ...requestSchema.required!,
        ...(requestBodySchema.required ?? []),
      ];
    }

    return { parameters, requestSchema };
  }

  private extractResponseSchema(responses: ResponsesObject) {
    const responsePairs = _.toPairs(responses) as [string, ResponseObject][];

    if (
      responsePairs.length !== 1 ||
      !responsePairs.some(
        ([statusCode]) => Number(statusCode) >= 200 && Number(statusCode) < 300
      )
    ) {
      throw new Error("only one success response must be provided");
    }

    const responseContent = responsePairs[0][1].content;

    if (!responseContent) {
      throw new Error("response content must be provided");
    } else if (!responseContent["application/json"]) {
      throw new Error(
        "currently supported content type is only 'application/json'"
      );
    } else if (!responseContent["application/json"].schema) {
      throw new Error("response schema must be provided");
    }

    return responseContent["application/json"].schema!;
  }
}
