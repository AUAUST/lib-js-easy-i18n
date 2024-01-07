import type { Config } from "jest";
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
  },
} satisfies Config;
