// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { LogLevel, logger, createLogger } from "../../../src/utils/logging.js";

describe("Logger", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Spy on stderr.write to capture log output
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    stderrSpy.mockRestore();

    // Restore original environment
    process.env = originalEnv;
  });

  describe("Construction", () => {
    test("creates logger with default configuration", () => {
      const testLogger = createLogger();
      const config = testLogger.getConfig();

      expect(config.level).toBe(LogLevel.INFO);
      expect(config.timestamps).toBe(true);
      expect(config.json).toBe(false);
    });

    test("accepts custom configuration", () => {
      const testLogger = createLogger({
        level: LogLevel.DEBUG,
        timestamps: false,
        json: true,
      });
      const config = testLogger.getConfig();

      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.timestamps).toBe(false);
      expect(config.json).toBe(true);
    });

    test("respects LOG_LEVEL environment variable", () => {
      process.env["LOG_LEVEL"] = "debug";

      const testLogger = createLogger();
      const config = testLogger.getConfig();

      expect(config.level).toBe(LogLevel.DEBUG);
    });

    test("respects LOG_JSON environment variable", () => {
      process.env["LOG_JSON"] = "true";

      const testLogger = createLogger();
      const config = testLogger.getConfig();

      expect(config.json).toBe(true);
    });

    test("ignores invalid LOG_LEVEL value", () => {
      process.env["LOG_LEVEL"] = "invalid";

      const testLogger = createLogger();
      const config = testLogger.getConfig();

      expect(config.level).toBe(LogLevel.INFO); // Should use default
    });
  });

  describe("Log Level Filtering", () => {
    test("DEBUG logs filtered when level is INFO", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      testLogger.debug("Debug message");

      expect(stderrSpy).not.toHaveBeenCalled();
    });

    test("INFO logs shown when level is INFO", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      testLogger.info("Info message");

      expect(stderrSpy).toHaveBeenCalled();
    });

    test("WARN logs shown when level is INFO", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      testLogger.warn("Warning message");

      expect(stderrSpy).toHaveBeenCalled();
    });

    test("ERROR logs shown when level is INFO", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      testLogger.error("Error message");

      expect(stderrSpy).toHaveBeenCalled();
    });

    test("only ERROR logs shown when level is ERROR", () => {
      const testLogger = createLogger({ level: LogLevel.ERROR });

      testLogger.debug("Debug");
      testLogger.info("Info");
      testLogger.warn("Warning");

      expect(stderrSpy).not.toHaveBeenCalled();

      testLogger.error("Error");

      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    test("all logs shown when level is DEBUG", () => {
      const testLogger = createLogger({ level: LogLevel.DEBUG });

      testLogger.debug("Debug");
      testLogger.info("Info");
      testLogger.warn("Warning");
      testLogger.error("Error");

      expect(stderrSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe("Output Methods", () => {
    test("debug() outputs with DEBUG level", () => {
      const testLogger = createLogger({ level: LogLevel.DEBUG, timestamps: false });

      testLogger.debug("Test message");

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[DEBUG]"));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Test message"));
    });

    test("info() outputs with INFO level", () => {
      const testLogger = createLogger({ level: LogLevel.INFO, timestamps: false });

      testLogger.info("Test message");

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"));
    });

    test("warn() outputs with WARN level", () => {
      const testLogger = createLogger({ level: LogLevel.WARN, timestamps: false });

      testLogger.warn("Test message");

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN]"));
    });

    test("error() outputs with ERROR level", () => {
      const testLogger = createLogger({ level: LogLevel.ERROR, timestamps: false });

      testLogger.error("Test message");

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"));
    });

    test("includes context when provided", () => {
      const testLogger = createLogger({ timestamps: false });
      const context = { userId: 123, action: "login" };

      testLogger.info("User action", context);

      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain(JSON.stringify(context));
    });

    test("handles empty context object", () => {
      const testLogger = createLogger({ timestamps: false });

      testLogger.info("Message", {});

      // Should not include empty context object in output
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).not.toContain("{}");
    });
  });

  describe("Human-Readable Format", () => {
    test("includes timestamp when enabled", () => {
      const testLogger = createLogger({ timestamps: true });

      testLogger.info("Test message");

      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    test("excludes timestamp when disabled", () => {
      const testLogger = createLogger({ timestamps: false });

      testLogger.info("Test message");

      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).not.toMatch(/\[\d{4}-\d{2}-\d{2}/);
    });

    test("formats message correctly", () => {
      const testLogger = createLogger({ timestamps: false });

      testLogger.info("Test message");

      expect(stderrSpy).toHaveBeenCalledWith("[INFO] Test message\n");
    });

    test("formats message with context", () => {
      const testLogger = createLogger({ timestamps: false });
      const context = { key: "value" };

      testLogger.info("Test message", context);

      expect(stderrSpy).toHaveBeenCalledWith(
        `[INFO] Test message ${JSON.stringify(context)}\n`
      );
    });
  });

  describe("JSON Format", () => {
    test("outputs structured JSON", () => {
      const testLogger = createLogger({ json: true, timestamps: false });

      testLogger.info("Test message");

      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Test message");
    });

    test("includes context in JSON", () => {
      const testLogger = createLogger({ json: true, timestamps: false });
      const context = { userId: 123 };

      testLogger.info("Test message", context);

      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.context).toEqual(context);
    });

    test("includes timestamp in JSON when enabled", () => {
      const testLogger = createLogger({ json: true, timestamps: true });

      testLogger.info("Test message");

      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    test("excludes timestamp in JSON when disabled", () => {
      const testLogger = createLogger({ json: true, timestamps: false });

      testLogger.info("Test message");

      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);

      expect(parsed.timestamp).toBeUndefined();
    });
  });

  describe("Configuration Management", () => {
    test("setLevel() changes log level", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      testLogger.debug("Should not appear");
      expect(stderrSpy).not.toHaveBeenCalled();

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug("Should appear");

      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    test("getConfig() returns frozen configuration", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      const config = testLogger.getConfig();

      expect(() => {
        (config as any).level = LogLevel.DEBUG;
      }).toThrow();
    });

    test("getConfig() returns copy of configuration", () => {
      const testLogger = createLogger({ level: LogLevel.INFO });

      const config1 = testLogger.getConfig();
      testLogger.setLevel(LogLevel.DEBUG);
      const config2 = testLogger.getConfig();

      expect(config1.level).toBe(LogLevel.INFO);
      expect(config2.level).toBe(LogLevel.DEBUG);
    });
  });

  describe("Singleton Logger", () => {
    test("logger instance is available", () => {
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    test("logger instance works correctly", () => {
      logger.info("Test message");

      expect(stderrSpy).toHaveBeenCalled();
    });
  });

  describe("Factory Function", () => {
    test("createLogger() creates independent loggers", () => {
      const logger1 = createLogger({ level: LogLevel.DEBUG });
      const logger2 = createLogger({ level: LogLevel.ERROR });

      logger1.debug("Debug message");
      const calls1 = stderrSpy.mock.calls.length;

      logger2.debug("Debug message");
      const calls2 = stderrSpy.mock.calls.length;

      // logger1 should log, logger2 should not
      expect(calls2).toBe(calls1);
    });
  });
});
