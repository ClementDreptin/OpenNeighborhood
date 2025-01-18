import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { isValidIpv4 } from "./utils";
import * as xbdm from "./xbdm";
import "server-only";

export interface Console {
  name: string;
  ipAddress: string;
}

const CONFIG_FILE_PATH = "consoles.json";

export async function getConsoles() {
  try {
    return await getConsolesFromFile();
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

export async function createConsole(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  let consoles: Console[];
  try {
    consoles = await getConsolesFromFile();
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      consoles = [];
    } else {
      throw err;
    }
  }

  if (consoles.find((console) => console.ipAddress === ipAddress) != null) {
    throw new Error(`Console with IP address ${ipAddress} already exists.`);
  }

  const consoleName = await xbdm.sendCommand(ipAddress, "Ok", "dbgname");

  consoles.push({ name: consoleName, ipAddress });

  await writeConsolesToFile(consoles);
}

export async function deleteConsole(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const consoles = await getConsolesFromFile();

  const consoleIndex = consoles.findIndex(
    (console) => console.ipAddress === ipAddress,
  );
  if (consoleIndex === -1) {
    throw new Error(`Console with IP address ${ipAddress} not found.`);
  }

  consoles.splice(consoleIndex, 1);

  await writeConsolesToFile(consoles);
}

export interface Drive {
  name: string;
  freeBytesAvailable: number;
  totalBytes: number;
  totalFreeBytes: number;
  totalUsedBytes: number;
  friendlyName: string;
}

export async function getDrives(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const response = await xbdm.sendCommand(
    ipAddress,
    "MultilineResponseFollows",
    "drivelist",
  );
  const lines = response !== "" ? response.split(xbdm.LINE_DELIMITER) : [];

  const drives: Drive[] = [];
  for (const line of lines) {
    const driveName = xbdm.getStringProperty(line, "drivename");
    const driveFreeSpaceResponse = await xbdm.sendCommand(
      ipAddress,
      "MultilineResponseFollows",
      `drivefreespace name="${driveName}:\\"`,
    );

    const freeToCallerHi = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "freetocallerhi",
    );
    const freeToCallerLo = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "freetocallerlo",
    );
    const totalBytesHi = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "totalbyteshi",
    );
    const totalBytesLo = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "totalbyteslo",
    );
    const totalFreeBytesHi = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "totalfreebyteshi",
    );
    const totalFreeBytesLo = xbdm.getIntegerProperty(
      driveFreeSpaceResponse,
      "totalfreebyteslo",
    );

    const freeBytesAvailable = Number(
      (BigInt(freeToCallerHi) << BigInt(32)) | BigInt(freeToCallerLo),
    );
    const totalBytes = Number(
      (BigInt(totalBytesHi) << BigInt(32)) | BigInt(totalBytesLo),
    );
    const totalFreeBytes = Number(
      (BigInt(totalFreeBytesHi) << BigInt(32)) | BigInt(totalFreeBytesLo),
    );
    const totalUsedBytes = totalBytes - freeBytesAvailable;

    drives.push({
      name: `${driveName}:`,
      freeBytesAvailable,
      friendlyName: xbdm.driveNameToDriveFriendlyName(driveName),
      totalBytes,
      totalFreeBytes,
      totalUsedBytes,
    });
  }

  return drives;
}

export interface File {
  name: string;
  size: number;
  isXex: boolean;
  isDirectory: boolean;
  creationDate: number;
  modificationDate: number;
}

export async function getFiles(ipAddress: string, dirPath: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const response = await xbdm.sendCommand(
    ipAddress,
    "MultilineResponseFollows",
    `dirlist name="${dirPath}"`,
  );
  const lines = response !== "" ? response.split(xbdm.LINE_DELIMITER) : [];

  const files = lines.map((line) => {
    const name = xbdm.getStringProperty(line, "name");
    const sizeHi = xbdm.getIntegerProperty(line, "sizehi");
    const sizeLo = xbdm.getIntegerProperty(line, "sizelo");
    const size = Number((BigInt(sizeHi) << BigInt(32)) | BigInt(sizeLo));
    const isDirectory = line.endsWith(" directory");
    const isXex = path.extname(name) === ".xex";
    const createHi = xbdm.getIntegerProperty(line, "createhi");
    const createLo = xbdm.getIntegerProperty(line, "createlo");
    const creationDate = xbdm.filetimeToUnixTime(
      Number((BigInt(createHi) << BigInt(32)) | BigInt(createLo)),
    );
    const changeHi = xbdm.getIntegerProperty(line, "changehi");
    const changeLo = xbdm.getIntegerProperty(line, "changelo");
    const modificationDate = xbdm.filetimeToUnixTime(
      Number((BigInt(changeHi) << BigInt(32)) | BigInt(changeLo)),
    );

    const file: File = {
      name,
      size,
      isXex,
      isDirectory,
      creationDate,
      modificationDate,
    };

    return file;
  });

  return files.sort((first, second) => {
    // Compare the file names (alphabetical)
    const firstNameGreaterThanSecondName = first.name > second.name;
    const secondNameGreaterThanFirstName = second.name > first.name;

    // If the file is a directory, decrease the score by 2. The score is decreased because the lower the score the closer
    // the element will be to the start of the array and we want directories to always be before files
    const firstScore =
      Number(firstNameGreaterThanSecondName) - Number(first.isDirectory) * 2;
    const secondScore =
      Number(secondNameGreaterThanFirstName) - Number(second.isDirectory) * 2;

    return firstScore - secondScore;
  });
}

export async function uploadFile(
  ipAddress: string,
  dirPath: string,
  file: globalThis.File,
) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const socket = await xbdm.connect(ipAddress);
  const reader = xbdm.createSocketReader(socket);
  await xbdm.readHeader(reader, "Connected");

  const filePath = path.win32.join(dirPath, file.name);
  const command = `sendfile name="${filePath}" length=0x${file.size.toString(16)}`;
  await xbdm.writeCommand(socket, command);
  await xbdm.readHeader(reader, "SendBinaryData");

  await pipeline(
    Readable.fromWeb(file.stream() as ReadableStream),
    xbdm.createWriteStream(socket),
  );
}

export async function launchXex(ipAddress: string, filePath: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const parentPath = path.win32.dirname(filePath);

  await xbdm.sendCommand(
    ipAddress,
    "Ok",
    `magicboot title="${filePath}" directory="${parentPath}"`,
  );
}

async function getConsolesFromFile() {
  const fileContent = await fs.promises.readFile(CONFIG_FILE_PATH, {
    encoding: "utf-8",
  });

  return JSON.parse(fileContent) as Console[];
}

async function writeConsolesToFile(consoles: Console[]) {
  await fs.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(consoles), {
    encoding: "utf-8",
  });
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
