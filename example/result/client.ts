import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import * as Models from "./models";

type DefaultConfig = AxiosRequestConfig & { baseURL: string };

export class Client {
  private instance: AxiosInstance;

  constructor(defaultConfig: DefaultConfig) {
    this.instance = axios.create(defaultConfig);
  }

  public async getBooksByCursor(
    params: Models.GetBooksByCursorRequestParameter
  ): Promise<Models.GetBooksByCursorResponse> {
    try {
      return (
        await this.instance.request({
          url: `/books`,
          method: "GET",

          params: {
            cursor: params.cursor,
          },
        })
      ).data;
    } catch (error) {
      throw error;
    }
  }

  public async createBook(
    params: Models.CreateBookRequestParameter
  ): Promise<Models.CreateBookResponse> {
    try {
      return (
        await this.instance.request({
          url: `/books`,
          method: "POST",
          data: {
            name: params.name,
          },
        })
      ).data;
    } catch (error) {
      throw error;
    }
  }

  public async deleteBookById(
    params: Models.DeleteBookByIdRequestParameter
  ): Promise<Models.DeleteBookByIdResponse> {
    try {
      return (
        await this.instance.request({
          url: `/books/${params.id}`,
          method: "DELETE",
        })
      ).data;
    } catch (error) {
      throw error;
    }
  }
}
