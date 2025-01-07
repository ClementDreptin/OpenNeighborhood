import net from "node:net";
import PromiseSocket from "promise-socket";
import "server-only";

export async function getConsoleName(ipAddress: string) {
  const lines = await sendCommand(ipAddress, "dbgname");

  if (lines.length !== 1) {
    console.log(lines);
    throw new Error("Too many lines returned while getting the console name.");
  }

  return lines[0].slice(5);
}

const CONNECTED_LINE = "201- connected";
const BYE_LINE = "200- bye";

async function sendCommand(ipAddress: string, command: string) {
  const socket = new PromiseSocket(new net.Socket()).setTimeout(3000);
  await socket.connect({ host: ipAddress, port: 730 });

  await socket.writeAll(`${command}\r\nbye\r\n`);
  const response = await socket.readAll();
  const data = response?.toString().trim();

  if (data == null) {
    throw new Error("Couldn't read from socket.");
  }

  const lines = data
    .split("\r\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines[0] !== CONNECTED_LINE) {
    throw new Error(`Expected response to start with '${CONNECTED_LINE}'.`);
  }

  if (lines[lines.length - 1] !== BYE_LINE) {
    throw new Error(`Expected response to end with '${BYE_LINE}'.`);
  }

  // Remove first and last lines
  return lines.slice(1, -1);
}
