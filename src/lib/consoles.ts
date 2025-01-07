import fs from "node:fs/promises";
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
