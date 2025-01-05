import fs from "node:fs/promises";
import "server-only";

export interface Console {
  name: string;
  ipAddress: string;
}

const CONFIG_FILE_PATH = "consoles.json";

export async function getConsoles() {
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, {
      encoding: "utf-8",
    });

    return JSON.parse(fileContent) as Console[];
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
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, {
      encoding: "utf-8",
    });

    consoles = JSON.parse(fileContent);
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") {
      consoles = [];
    } else {
      throw err;
    }
  }

  consoles.push({ name: "XBOX", ipAddress });

  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(consoles), {
    encoding: "utf-8",
  });
}

export async function deleteConsole(ipAddress: string) {
  if (!IPV4_REGEX.test(ipAddress)) {
    throw new Error("IP address is not valid.");
  }

  const fileContent = await fs.readFile(CONFIG_FILE_PATH, {
    encoding: "utf-8",
  });
  const consoles = JSON.parse(fileContent) as Console[];

  const consoleIndex = consoles.findIndex(
    (console) => console.ipAddress === ipAddress,
  );
  if (consoleIndex === -1) {
    throw new Error(`Console with ip address ${ipAddress} not found.`);
  }

  consoles.splice(consoleIndex, 1);

  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(consoles), {
    encoding: "utf-8",
  });
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
