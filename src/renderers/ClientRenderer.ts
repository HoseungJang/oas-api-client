import * as _ from "lodash";
import * as prettier from "prettier";

import { BaseRenderer } from "./BaseRenderer";
import { Operation } from "../OperationExtractor";

export class ClientRenderer extends BaseRenderer {
  constructor(private readonly operations: Operation[]) {
    super();
  }

  public async render() {
    const requestMethods = this.operations.map((operation) => {
      const url =
        operation.parameters.path.length > 0
          ? operation.parameters.path.reduce((path, parameterName) => {
              return path.replace(
                new RegExp(`{${parameterName}}`, "g"),
                `\${params.${parameterName}}`
              );
            }, operation.path)
          : operation.path;

      const requestBody =
        operation.parameters.body.length > 0
          ? `data: {
              ${operation.parameters.body
                .map(
                  (parameterName) =>
                    `${parameterName}: params.${parameterName},`
                )
                .join("\n")}
            },`
          : null;

      const query =
        operation.parameters.query.length > 0
          ? `params: {
              ${operation.parameters.query
                .map(
                  (parameterName) =>
                    `${parameterName}: params.${parameterName},`
                )
                .join("\n")}
            }`
          : null;

      // prettier-ignore
      return `
        public async ${operation.id}(params: Models.${operation.requestModelName}): Promise<Models.${operation.responseModelName}> {
          try {
            return (
              await this.instance.request({
                url: \`${url}\`,
                method: "${operation.method}",
                ${requestBody ?? ""}
                ${query ?? ""}
              })
            ).data;
          } catch (error) {
            throw error;
          }
        }
      `;
    });

    return this.format(`
      import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

      import * as Models from "./models";

      type DefaultConfig = AxiosRequestConfig & { baseURL: string };

      export class Client {
        private instance: AxiosInstance;

        constructor(defaultConfig: DefaultConfig) {
          this.instance = axios.create(defaultConfig);
        }
        ${requestMethods.join("\n\n")}
      }`
    );
  }
}
