import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import type { Archiver } from "archiver";
import * as fastPng from "fast-png";
import { isValidIpv4 } from "./utils";
import * as xbdm from "./xbdm";
import "server-only";

export interface Console {
  name: string;
  ipAddress: string;
  type: string;
  activeTitle: string;
}

const CONFIG_FILE_PATH = "consoles.json";

export async function getConsoles() {
  let consolesFromFile: Console[];
  try {
    consolesFromFile = await getConsolesFromFile();
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      return [];
    }

    throw err;
  }

  // The consoles from the file are incomplete so we fetch their
  // info before returning them
  const consoles: Console[] = [];
  for (const consoleFromFile of consolesFromFile) {
    consoles.push({
      name: await getConsoleName(consoleFromFile.ipAddress),
      ipAddress: consoleFromFile.ipAddress,
      type: await getConsoleType(consoleFromFile.ipAddress),
      activeTitle: await getActiveTitle(consoleFromFile.ipAddress),
    });
  }

  return consoles;
}

export async function getConsoleName(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  return await xbdm.sendCommand(ipAddress, xbdm.STATUS_CODES.Ok, "dbgname");
}

export async function getConsoleType(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  return await xbdm.sendCommand(ipAddress, xbdm.STATUS_CODES.Ok, "consoletype");
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

  // No need to get the console type and active title right away, these can be fetched later
  consoles.push({
    name: await getConsoleName(ipAddress),
    ipAddress,
    type: "",
    activeTitle: "",
  });

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
    xbdm.STATUS_CODES.MultilineResponseFollows,
    "drivelist",
  );
  const lines = response !== "" ? response.split(xbdm.LINE_DELIMITER) : [];

  const drives: Drive[] = [];
  for (const line of lines) {
    const driveName = xbdm.getStringProperty(line, "drivename");
    const driveFreeSpaceResponse = await xbdm.sendCommand(
      ipAddress,
      xbdm.STATUS_CODES.MultilineResponseFollows,
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
    xbdm.STATUS_CODES.MultilineResponseFollows,
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

export async function downloadFile(ipAddress: string, filePath: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const socket = await xbdm.connect(ipAddress);
  const reader = xbdm.createSocketReader(socket);
  await xbdm.readHeader(reader, xbdm.STATUS_CODES.Connected);

  await xbdm.writeCommand(socket, `getfile name="${filePath}"`);

  await xbdm.readHeader(reader, xbdm.STATUS_CODES.BinaryResponseFollows);

  const sizeBuffer = await reader.readBytes(4);
  const size = sizeBuffer.readUInt32LE();

  const stream = reader.streamRemainingData(size);

  return { size, stream };
}

export async function downloadDirectory(
  ipAddress: string,
  dirPath: string,
  archive: Archiver,
  baseDirPath = dirPath,
) {
  const files = await getFiles(ipAddress, dirPath);

  for (const file of files) {
    const filePath = path.win32.join(dirPath, file.name);

    if (file.isDirectory) {
      await downloadDirectory(ipAddress, filePath, archive, baseDirPath);
      continue;
    }

    const { stream, size } = await downloadFile(ipAddress, filePath);
    const entryName = path.win32.relative(baseDirPath, filePath);
    archive.append(stream, { name: entryName });

    // The console won't close the connection when sending the file is done so we need to
    // manually close the stream once we've sent all the data
    let bytesSent = 0;
    stream.on("data", (chunk: Buffer) => {
      bytesSent += chunk.byteLength;
      if (bytesSent >= size) {
        stream.emit("end");
        stream.destroy();
      }
    });

    // We have to wait for the current file to finish reading before going to the next
    // one, otherwise we can run into "401- max number of connections exceeded" errors
    // for very large directories
    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });
  }
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
  await xbdm.readHeader(reader, xbdm.STATUS_CODES.Connected);

  const filePath = path.win32.join(dirPath, file.name);
  const command = `sendfile name="${filePath}" length=0x${file.size.toString(16)}`;
  await xbdm.writeCommand(socket, command);
  await xbdm.readHeader(reader, xbdm.STATUS_CODES.SendBinaryData);

  await pipeline(
    Readable.fromWeb(file.stream() as ReadableStream),
    xbdm.createWriteStream(socket),
  );
}

export async function deleteFile(
  ipAddress: string,
  filePath: string,
  isDirectory: string,
) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  if (isDirectory === "true") {
    const files = await getFiles(ipAddress, filePath);

    for (const file of files) {
      await deleteFile(
        ipAddress,
        path.win32.join(filePath, file.name),
        String(file.isDirectory),
      );
    }
  }

  await xbdm.sendCommand(
    ipAddress,
    xbdm.STATUS_CODES.Ok,
    `delete name="${filePath}"${isDirectory === "true" ? " dir" : ""}`,
  );
}

export async function renameFile(
  ipAddress: string,
  oldName: string,
  newName: string,
) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  await xbdm.sendCommand(
    ipAddress,
    xbdm.STATUS_CODES.Ok,
    `rename name="${oldName}" newname="${newName}"`,
  );
}

export async function createDirectory(
  ipAddress: string,
  dirName: string,
  parentPath: string,
) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const fullPath = path.win32.join(parentPath, dirName);

  try {
    await xbdm.sendCommand(
      ipAddress,
      xbdm.STATUS_CODES.Ok,
      `mkdir name="${fullPath}"`,
    );
  } catch (err) {
    if (
      err instanceof Error &&
      err.cause === xbdm.STATUS_CODES.FileAlreadyExists
    ) {
      throw new Error(
        `A file or directory with the name "${dirName}" already exists.`,
      );
    }

    throw err;
  }
}

export async function launchXex(ipAddress: string, filePath: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const parentPath = path.win32.dirname(filePath);

  await xbdm.sendCommand(
    ipAddress,
    xbdm.STATUS_CODES.Ok,
    `magicboot title="${filePath}" directory="${parentPath}"`,
  );
}

export async function goToDashboard(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  await xbdm.sendCommand(ipAddress, xbdm.STATUS_CODES.Ok, "magicboot");
}

export async function restartActiveTitle(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  await launchXex(ipAddress, await getActiveTitle(ipAddress));
}

export async function reboot(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  // We expect the command to fail here, because the console will close the connection
  // immediately after receiving the command
  try {
    await xbdm.sendCommand(ipAddress, xbdm.STATUS_CODES.Ok, "magicboot COLD");
  } catch (err) {
    // We expect a specific error, if it's anything else, rethrow
    if (
      !(err instanceof Error) ||
      err.message !== "Connection was closed by the console."
    ) {
      throw err;
    }

    return;
  }

  // We shouldn't ever get here, but if we do, notify the user
  throw new Error("Couldn't reboot the console.");
}

export async function shutdown(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  // We expect the command to fail here, because the console will close the connection
  // immediately after receiving the command
  try {
    await xbdm.sendCommand(ipAddress, xbdm.STATUS_CODES.Ok, "shutdown");
  } catch (err) {
    // We expect a specific error, if it's anything else, rethrow
    if (
      !(err instanceof Error) ||
      err.message !== "Connection was closed by the console."
    ) {
      throw err;
    }

    return;
  }

  // We shouldn't ever get here, but if we do, notify the user
  throw new Error("Couldn't shut the console down.");
}

export async function syncTime(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const fileTime = xbdm.unixTimeToFiletime(Date.now() / 1000);
  const clockHi = Number(BigInt(fileTime) >> BigInt(32));
  const clockLo = Number(BigInt(fileTime) & BigInt(0xffffffff));

  await xbdm.sendCommand(
    ipAddress,
    xbdm.STATUS_CODES.Ok,
    `setsystime clockhi=0x${clockHi.toString(16)} clocklo=0x${clockLo.toString(16)}`,
  );
}

export async function getActiveTitle(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const response = await xbdm.sendCommand(
    ipAddress,
    xbdm.STATUS_CODES.MultilineResponseFollows,
    "xbeinfo running",
  );

  return xbdm.getStringProperty(response, "name");
}

export async function screenshot(ipAddress: string) {
  if (!isValidIpv4(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const socket = await xbdm.connect(ipAddress);
  const reader = xbdm.createSocketReader(socket);
  await xbdm.readHeader(reader, xbdm.STATUS_CODES.Connected);

  await xbdm.writeCommand(socket, "screenshot");

  await xbdm.readHeader(reader, xbdm.STATUS_CODES.BinaryResponseFollows);

  const infoLine = await reader.readLine();

  const specs: xbdm.ScreenshotSpecs = {
    pitch: xbdm.getIntegerProperty(infoLine, "pitch"),
    width: xbdm.getIntegerProperty(infoLine, "width"),
    height: xbdm.getIntegerProperty(infoLine, "height"),
    format: xbdm.getIntegerProperty(infoLine, "format"),
    offsetX: xbdm.getIntegerProperty(infoLine, "offsetx"),
    offsetY: xbdm.getIntegerProperty(infoLine, "offsety"),
    framebufferSize: xbdm.getIntegerProperty(infoLine, "framebuffersize"),
  };

  const framebuffer = await reader.readBytes(specs.framebufferSize);
  const deswizzledFramebuffer = xbdm.deswizzleFramebuffer(framebuffer, specs);

  return fastPng.encode({
    width: specs.width,
    height: specs.height,
    data: deswizzledFramebuffer,
  });
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
