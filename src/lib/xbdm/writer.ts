import type { Socket } from "node:net";
import { Writable } from "node:stream";

export async function write(socket: Socket, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(buffer, (error) => {
      if (error != null) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function createWriteStream(socket: Socket) {
  return new Writable({
    write: (chunk, encoding, callback) => {
      socket.write(chunk as Buffer, encoding, callback);
    },
    destroy: (error, callback) => {
      socket.destroy(error ?? undefined);
      callback(error);
    },
  });
}
