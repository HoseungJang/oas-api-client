#!/usr/bin/env node
import { Command } from "commander";
import got from "got";
import { OpenAPIObject } from "openapi3-ts";
import * as fs from "fs";

import { ClientGenerator } from "./ClientGenerator";

function deleteDirectoryRecursive(path: string) {
  fs.readdirSync(path).forEach((file) => {
    const currentPath = `${path}/${file}`;

    if (fs.lstatSync(currentPath).isDirectory()) {
      deleteDirectoryRecursive(currentPath);
    } else {
      fs.unlinkSync(currentPath);
    }
  });
  fs.rmdirSync(path);
}

const program = new Command();

program
  .command("generate")
  .description("generate OAS API client")
  .option(
    "-u, --url <url>",
    "HTTP URL which provide OpenAPI specification (must be JSON)"
  )
  .option(
    "-f, --file <path>",
    "absolute or relative path of OpenAPI specification (must be JSON)"
  )
  .option("-o, --outputDir <path>", "output path", "./oasis")
  .action(async (options) => {
    const { url, file, outputDir } = options;

    let APIDefinition: OpenAPIObject;
    if (url) {
      APIDefinition = await got(url).json();
    } else if (file) {
      if (!/.json$/.test(file)) {
        throw new Error("unsupported file format (must be JSON)");
      }
      APIDefinition = JSON.parse(fs.readFileSync(file).toString());
    } else {
      throw new Error("--url or --file option must be provided");
    }

    if (fs.existsSync(outputDir)) {
      deleteDirectoryRecursive(outputDir);
    }
    fs.mkdirSync(outputDir);

    await new ClientGenerator(APIDefinition, outputDir).generate();
  });

program.parse();
