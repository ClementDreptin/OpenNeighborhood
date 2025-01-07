import net from "node:net";
import PromiseSocket from "promise-socket";
import "server-only";

export async function sendCommand(
  ipAddress: string,
  expect: Status,
  command: string,
) {
  const socket = new PromiseSocket(new net.Socket()).setTimeout(3000);
  await socket.connect({ host: ipAddress, port: 730 });

  await socket.writeAll(`${command}\r\nbye\r\n`);
  const response = await socket.readAll();
  const data = response?.toString().trim();

  if (data == null) {
    throw new Error("Couldn't read from socket.");
  }

  const lines = data
    .split(LINE_DELIMITER)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!hasStatus(lines[0], "Connected")) {
    throw new Error("Expected response to start with 'connected'.");
  }
  lines.shift();

  if (readHeader(lines[lines.length - 1], "Ok") !== "bye") {
    throw new Error("Expected response to end with 'bye'.");
  }
  lines.pop();

  const header = readHeader(lines[0], expect);

  if (expect === "MultilineResponseFollows") {
    return lines.slice(1, -1).join(LINE_DELIMITER);
  }

  return header;
}

export function hasStatus(line: string, expect: Status) {
  const statusCodeString = line.substring(0, 3);
  const expectedStatusCode = STATUS_CODES[expect];

  return statusCodeString === expectedStatusCode;
}

export function readHeader(line: string, expect: Status) {
  if (!hasStatus(line, expect)) {
    throw new Error(
      `Unexpected status code. Expected ${expect} but received ${line}.`,
    );
  }

  // The response prefix is "XXX- ", so 5 characters
  return line.substring(5);
}

export function getStringProperty(line: string, propertyName: string) {
  const propertyStartIndex = line.indexOf(propertyName);
  if (propertyStartIndex === -1) {
    throw new Error(`Property '${propertyName}' not found in ${line}.`);
  }

  const propertyEndIndex = propertyStartIndex + propertyName.length;
  const equalIndex = line.indexOf("=", propertyEndIndex);
  if (equalIndex === -1) {
    throw new Error(`Expected ${line} to contain '='.`);
  }
  if (equalIndex !== propertyEndIndex) {
    throw new Error(
      `Expected '=' to be right after the end of ${propertyName}.`,
    );
  }

  const firstQuoteIndex = line.indexOf('"', equalIndex);
  if (firstQuoteIndex === -1) {
    throw new Error(`Expected ${line} to contain '"'.`);
  }
  if (firstQuoteIndex !== equalIndex + 1) {
    throw new Error("Expected first '\"' to be right after '='.");
  }

  const lastQuoteIndex = line.indexOf('"', firstQuoteIndex + 1);
  if (lastQuoteIndex === -1) {
    throw new Error(`Expected ${line} to contain a second '\"'.`);
  }

  return line.substring(firstQuoteIndex + 1, lastQuoteIndex);
}

export function getIntegerProperty(line: string, propertyName: string) {
  const propertyStartIndex = line.indexOf(propertyName);
  if (propertyStartIndex === -1) {
    throw new Error(`Property '${propertyName}' not found in ${line}.`);
  }

  const propertyEndIndex = propertyStartIndex + propertyName.length;
  const equalIndex = line.indexOf("=", propertyEndIndex);
  if (equalIndex === -1) {
    throw new Error(`Expected ${line} to contain '='.`);
  }
  if (equalIndex !== propertyEndIndex) {
    throw new Error(
      `Expected '=' to be right after the end of ${propertyName}.`,
    );
  }

  let valueEndIndex = line.indexOf(" ", equalIndex + 1);
  if (valueEndIndex === -1) {
    valueEndIndex = line.length - 1;
  }

  const valueString = line.substring(equalIndex + 1, valueEndIndex);
  const value = Number(valueString);
  if (Number.isNaN(value)) {
    throw new Error(`Couldn't convert ${valueString} into a number.`);
  }

  return value;
}

export function driveNameToDriveFriendlyName(driveName: string) {
  switch (driveName) {
    case "DEVKIT":
    case "E":
      return "Game Development Volume";
    case "HDD":
      return "Retail Hard Drive Emulation";
    case "Y":
      return "Xbox360 Dashboard Volume";
    case "Z":
      return "Devkit Drive";
    case "D":
    case "GAME":
      return "Active Title Media";
    default:
      return "Volume";
  }
}

export const LINE_DELIMITER = "\r\n";

export const STATUS_CODES = {
  Ok: "200",
  Connected: "201",
  MultilineResponseFollows: "202",
} as const;
export type Status = keyof typeof STATUS_CODES;
