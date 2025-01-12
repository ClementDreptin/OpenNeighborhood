import fs from "node:fs/promises";
import path from "node:path";
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

const IPV4_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export async function createConsole(ipAddress: string) {
  if (!IPV4_REGEX.test(ipAddress)) {
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

  const consoleName = await xbdm.sendCommand(ipAddress, "Ok", "dbgname");

  consoles.push({ name: consoleName, ipAddress });

  await writeConsolesToFile(consoles);
}

export async function deleteConsole(ipAddress: string) {
  if (!IPV4_REGEX.test(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const consoles = await getConsolesFromFile();

  const consoleIndex = consoles.findIndex(
    (console) => console.ipAddress === ipAddress,
  );
  if (consoleIndex === -1) {
    throw new Error(`Console with ip address ${ipAddress} not found.`);
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
  if (!IPV4_REGEX.test(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const driveListResponse = await xbdm.sendCommand(
    ipAddress,
    "MultilineResponseFollows",
    "drivelist",
  );
  const driveListResponseLines = driveListResponse.split(xbdm.LINE_DELIMITER);

  const drives: Drive[] = [];
  for (const line of driveListResponseLines) {
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
  if (!IPV4_REGEX.test(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const response = await xbdm.sendCommand(
    ipAddress,
    "MultilineResponseFollows",
    `dirlist name=\"${dirPath}\"`,
  );
  const lines = response.split(xbdm.LINE_DELIMITER);

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
    const firstNameGreaterThanSecondName = first.name > second.name;
    const secondNameGreaterThanFirstName = second.name > first.name;

    const firstScore =
      Number(firstNameGreaterThanSecondName) - Number(first.isDirectory) * 2;
    const secondScore =
      Number(secondNameGreaterThanFirstName) - Number(second.isDirectory) * 2;

    return firstScore - secondScore;
  });
}

export async function launchXex(ipAddress: string, filePath: string) {
  if (!IPV4_REGEX.test(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const parentPath = path.win32.dirname(filePath);

  await xbdm.sendCommand(
    ipAddress,
    "Ok",
    `magicboot title=\"${filePath}\" directory=\"${parentPath}\"`,
  );
}

async function getConsolesFromFile() {
  const fileContent = await fs.readFile(CONFIG_FILE_PATH, {
    encoding: "utf-8",
  });

  return JSON.parse(fileContent) as Console[];
}

async function writeConsolesToFile(consoles: Console[]) {
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(consoles), {
    encoding: "utf-8",
  });
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
