import { Socket } from "node:net";
import { LINE_DELIMITER, STATUS_CODES, type Status } from "./constants";
import { createSocketReader, type SocketReader } from "./reader";
import { write } from "./writer";
import "server-only";

export async function sendCommand(
  ipAddress: string,
  expect: Status,
  command: string,
) {
  const socket = await connect(ipAddress);
  const reader = createSocketReader(socket);

  await writeCommand(socket, command);

  // Every connection starts with a "200- connected" response
  await readHeader(reader, "Connected");

  // The first line of every response is a header giving information
  // about the response type (success/error or singleline/multiline/binary)
  const header = await readHeader(reader, expect);

  const lines = [];
  if (expect === "MultilineResponseFollows") {
    for (;;) {
      const line = await reader.readLine();

      // Multiline responses always end with a line just containing "."
      if (line === ".") {
        break;
      }

      lines.push(line);
    }
  }

  // Because every command is followed by a "bye" command, that tells the console to
  // close the connection whenever it's done, the final response needs to be "200- bye"
  const byeHeader = await readHeader(reader, "Ok");
  if (byeHeader !== "bye") {
    throw new Error("Expected response to end with 'bye'.");
  }

  // For multiline responses, the return value is the concatenation of all the lines
  // except for the last one with just the "."
  if (expect === "MultilineResponseFollows") {
    return lines.join(LINE_DELIMITER);
  }

  // For any response other than a multiline response, the return value is what was after
  // the status code, e.g.
  // "200- ConsoleName" => "ConsoleName"
  return header;
}

export async function connect(ipAddress: string): Promise<Socket> {
  const socket = new Socket().setTimeout(3000);

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      resolve(socket);
    };

    const onTimeout = () => {
      reject(new Error("Timeout."));
    };

    socket.once("error", reject);
    socket.once("timeout", onTimeout);
    socket.connect({ host: ipAddress, port: 730 }, onConnect);
  });
}

export async function writeCommand(socket: Socket, command: string) {
  // Follow the command by a "bye" command to tell the console to close the connection
  // whenever it's done
  const fullCommand = [command, "bye"].join(LINE_DELIMITER);
  await write(socket, Buffer.from(`${fullCommand}\r\n`));
}

export async function readHeader(reader: SocketReader, expect: Status) {
  // Headers have the following format
  // "XXX- <response_type|content>"
  // where "XXX" are 3 decimal digits giving the status code.
  // For most status codes, the header content is a string representation of the status
  // code, e.g. "201" => "connected".
  // For the "200" status code, the header content itself is the return value. For example,
  // the "dbgname" command returns "200- <console_name>"

  const line = await reader.readLine();
  const statusCodeString = line.substring(0, 3);

  if (statusCodeString !== STATUS_CODES[expect]) {
    const error = new Error(
      `Unexpected status code. Expected ${expect} but received ${line}.`,
    );
    error.cause = statusCodeString;
    throw error;
  }

  // The response prefix is "XXX- ", so 5 characters
  return line.substring(5);
}
