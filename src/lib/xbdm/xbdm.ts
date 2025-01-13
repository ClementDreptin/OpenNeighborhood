import { Socket } from "node:net";
import PromiseSocket from "promise-socket";
import { LINE_DELIMITER, STATUS_CODES, type Status } from "./constants";
import { createSocketReader, type SocketReader } from "./reader";
import "server-only";

export async function sendCommand(
  ipAddress: string,
  expect: Status,
  command: string,
) {
  const socket = await connect(ipAddress);
  const reader = createSocketReader(socket);

  await writeCommand(socket, command);
  await readHeader(reader, "Connected");

  const lines = [];
  const header = await readHeader(reader, expect);

  if (expect === "MultilineResponseFollows") {
    for (;;) {
      const line = await reader.readLine();
      if (line === ".") {
        break;
      }

      lines.push(line);
    }
  }

  const byeHeader = await readHeader(reader, "Ok");
  if (byeHeader !== "bye") {
    throw new Error("Expected response to end with 'bye'.");
  }

  if (expect === "MultilineResponseFollows") {
    return lines.join(LINE_DELIMITER);
  }

  return header;
}

export async function connect(ipAddress: string) {
  const socket = new PromiseSocket(new Socket()).setTimeout(3000);
  await socket.connect({ host: ipAddress, port: 730 });

  return socket.socket;
}

export async function writeCommand(socket: Socket, command: string) {
  const wrapper = new PromiseSocket(socket);
  await wrapper.writeAll(`${command}\r\nbye\r\n`);
}

export async function readHeader(reader: SocketReader, expect: Status) {
  const line = await reader.readLine();
  const statusCodeString = line.substring(0, 3);

  if (statusCodeString !== STATUS_CODES[expect]) {
    throw new Error(
      `Unexpected status code. Expected ${expect} but received ${line}.`,
    );
  }

  // The response prefix is "XXX- ", so 5 characters
  return line.substring(5);
}
