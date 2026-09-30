import type { Config } from "jest";
import { pathsToModuleNameMapper } from "ts-jest";
import ts from "typescript";

const tsconfigPath = "./tsconfig.json";

const { config: tsconfig } = ts.readConfigFile(
  tsconfigPath,
  ts.sys.readFile,
);

const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  rootDir: ".",

  moduleFileExtensions: ["js", "json", "ts"],

  testRegex: ".*\\.spec\\.ts$",

  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: tsconfigPath,
      },
    ],
  },

  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, {
      prefix: "<rootDir>/",
    }),
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testEnvironment: "node",

  collectCoverageFrom: [
    "src/**/*.ts",
    "libs/**/*.ts",
    "apps/**/*.ts",
  ],

  coverageDirectory: "./coverage",
};

export default config;