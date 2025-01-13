import type { Socket } from "node:net";
import { LINE_DELIMITER } from "./constants";

export interface SocketReader {
  readLine: () => Promise<string>;
  readBytes: (count: number) => Promise<Buffer>;
  streamRemainingData: () => ReadableStream;
}

export function createSocketReader(socket: Socket): SocketReader {
  let buffer = Buffer.alloc(0);

  const readLine = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const findNewLine = () => buffer.indexOf(LINE_DELIMITER);

      let newLineIndex = findNewLine();
      if (newLineIndex !== -1) {
        const line = buffer.subarray(0, newLineIndex).toString();
        buffer = buffer.subarray(newLineIndex + LINE_DELIMITER.length);
        resolve(line);
        return;
      }

      const onData = (data: Buffer) => {
        buffer = Buffer.concat([buffer, data]);

        newLineIndex = findNewLine();
        if (newLineIndex === -1) {
          return;
        }

        const line = buffer.subarray(0, newLineIndex).toString();
        buffer = buffer.subarray(newLineIndex + LINE_DELIMITER.length);

        socket.off("data", onData);
        socket.off("error", onError);

        resolve(line);
      };

      const onError = (error: Error) => {
        socket.off("data", onData);
        socket.off("error", onError);
        reject(error);
      };

      socket.on("data", onData);
      socket.on("error", onError);
    });
  };

  const readBytes = async (length: number): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      if (buffer.length >= length) {
        const result = buffer.subarray(0, length);
        buffer = buffer.subarray(length);
        resolve(result);
        return;
      }

      const onData = (data: Buffer) => {
        buffer = Buffer.concat([buffer, data]);

        if (buffer.length < length) {
          return;
        }

        const result = buffer.subarray(0, length);
        buffer = buffer.subarray(length);

        socket.off("data", onData);
        socket.off("error", onError);
        resolve(result);
      };

      const onError = (error: Error) => {
        socket.off("data", onData);
        socket.off("error", onError);
        reject(error);
      };

      socket.on("data", onData);
      socket.on("error", onError);
    });
  };

  const streamRemainingData = () => {
    return new ReadableStream({
      start: (controller) => {
        if (buffer.length > 0) {
          controller.enqueue(buffer);
          buffer = Buffer.alloc(0);
        }

        socket.on("data", (data) => {
          controller.enqueue(data);
        });
        socket.on("error", (error: Error) => {
          controller.error(error);
        });
        socket.on("end", () => {
          controller.close();
        });
      },
      cancel: () => {
        socket.destroy();
      },
    });
  };

  return { readLine, readBytes, streamRemainingData };
}
