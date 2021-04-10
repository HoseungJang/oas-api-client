#!/usr/bin/env node
import { Command, OptionValues } from "commander";
import got from "got";
import { OpenAPIObject } from "openapi3-ts";
import * as fs from "fs";

import { ClientGenerator } from "./ClientGenerator";

class Program {
  private readonly options: OptionValues;

  constructor() {
    const program = new Command();

    program
      .option(
        "-u, --url <url>",
        "HTTP URL which provide OpenAPI specification (must be JSON)"
      )
      .option(
        "-f, --file <path>",
        "absolute or relative path of OpenAPI specification (must be JSON)"
      )
      .option("-o, --outputDir <path>", "output path", "./oasis");

    program.parse();
    this.options = program.opts();
  }

  public async run() {
    const { url, file, outputDir } = this.options;

    let APIDefinition: OpenAPIObject;
    if (url) {
      APIDefinition = await got(this.options.url).json();
    } else if (file) {
      if (!/.json$/.test(this.options.file)) {
        throw new Error("unsupported file format (must be JSON)");
      }
      APIDefinition = JSON.parse(fs.readFileSync(this.options.file).toString());
    } else {
      throw new Error("--url or --file option must be provided");
    }

    if (fs.existsSync(outputDir)) {
      this.deleteDirectoryRecursive(outputDir);
    }
    fs.mkdirSync(outputDir);

    await new ClientGenerator(APIDefinition, outputDir).generate();
  }

  private deleteDirectoryRecursive(path: string) {
    fs.readdirSync(path).forEach((file) => {
      const currentPath = `${path}/${file}`;

      if (fs.lstatSync(currentPath).isDirectory()) {
        this.deleteDirectoryRecursive(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
    fs.rmdirSync(path);
  }
}

new Program().run();
