import type { Socket } from "node:net";
import { Readable } from "node:stream";
import { LINE_DELIMITER } from "./constants";

export interface SocketReader {
  readLine: () => Promise<string>;
  readBytes: (count: number) => Promise<Buffer>;
  streamRemainingData: (maxSize?: number) => Readable;
}

export function createSocketReader(socket: Socket): SocketReader {
  // Internal buffer that holds data that has been read from the socket
  // but not returned by readLine of readBytes yet
  let buffer = Buffer.alloc(0);

  const readLine = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const findNewLine = () => buffer.indexOf(LINE_DELIMITER);

      // If an entire line is already present in the internal buffer,
      // remove it and return early
      let newLineIndex = findNewLine();
      if (newLineIndex !== -1) {
        const line = buffer.subarray(0, newLineIndex).toString();
        buffer = buffer.subarray(newLineIndex + LINE_DELIMITER.length);
        resolve(line);
        return;
      }

      // If the internal buffer doesn't contain a line, read from the socket
      const onData = (chunk: Buffer) => {
        // Append the chunk to the internal buffer
        buffer = Buffer.concat([buffer, chunk]);

        // If the internal buffer doesn't contain a full line, stop here and wait for a
        // new chunk to arrive
        newLineIndex = findNewLine();
        if (newLineIndex === -1) {
          return;
        }

        // Remove the line from the internal buffer before returning it
        const line = buffer.subarray(0, newLineIndex).toString();
        buffer = buffer.subarray(newLineIndex + LINE_DELIMITER.length);

        socket.off("data", onData);
        socket.off("end", onEnd);
        socket.off("error", onError);
        socket.off("close", onClose);
        resolve(line);
      };

      const onEnd = () => {
        socket.off("data", onData);
      };

      const onError = (error: Error) => {
        socket.off("data", onData);
        reject(error);
      };

      const onClose = (hadError: boolean) => {
        socket.off("data", onData);
        reject(
          new Error(
            hadError
              ? "Connection closes due to a transmission error."
              : "Connection was closed by the console.",
          ),
        );
      };

      socket.on("data", onData);
      socket.once("end", onEnd);
      socket.once("error", onError);
      socket.once("close", onClose);
    });
  };

  const readBytes = async (length: number): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      // If enough bytes are already present in the internal buffer,
      // remove them from it and return early
      if (buffer.length >= length) {
        const result = buffer.subarray(0, length);
        buffer = buffer.subarray(length);
        resolve(result);
        return;
      }

      // If the internal buffer doesn't contain enough bytes, read from the socket
      const onData = (chunk: Buffer) => {
        // Append the chunk to the internal buffer
        buffer = Buffer.concat([buffer, chunk]);

        // If the internal buffer doesn't contain enough bytes, stop here and wait for a
        // new chunk to arrive
        if (buffer.length < length) {
          return;
        }

        // Remove `length` bytes from the internal buffer before returning them
        const result = buffer.subarray(0, length);
        buffer = buffer.subarray(length);

        socket.off("data", onData);
        socket.off("end", onEnd);
        socket.off("error", onError);
        socket.off("close", onClose);
        resolve(result);
      };

      const onEnd = () => {
        socket.off("data", onData);
      };

      const onError = (error: Error) => {
        socket.off("data", onData);
        reject(error);
      };

      const onClose = (hadError: boolean) => {
        socket.off("data", onData);
        reject(
          new Error(
            hadError
              ? "Connection closes due to a transmission error."
              : "Connection was closed by the console.",
          ),
        );
      };

      socket.on("data", onData);
      socket.once("end", onEnd);
      socket.once("error", onError);
      socket.once("close", onClose);
    });
  };

  // Convert the rest of the data, up to maxSize if defined, into a Readable
  const streamRemainingData = (maxSize?: number) => {
    let bytesRead = 0;

    const readable = new Readable({
      read() {
        // If the internal buffer still contains data, push its content into
        // the stream and flush the buffer
        if (buffer.length > 0) {
          // If a maxSize was defined and the internal buffer is big enough
          // to push maxSize bytes into the stream, push maxSize bytes from
          // the internal buffer and end the stream here
          if (maxSize != null && buffer.length > maxSize) {
            const chunk = buffer.subarray(0, maxSize);

            this.push(chunk);
            this.push(null);
            bytesRead = maxSize;

            buffer = buffer.subarray(chunk.length);

            return;
          }

          this.push(buffer);
          bytesRead += buffer.length;

          buffer = Buffer.alloc(0);
        }
      },
      destroy(error, callback) {
        socket.destroy(error ?? undefined);
        callback(error);
      },
    });

    // Map socket events to controller events

    const onData = (data: Buffer) => {
      // If a maxSize was defined and will be reached with this chunk, cut the
      // chunk to make sure no more than maxSize bytes are pushed in total
      if (maxSize != null && bytesRead + data.length > maxSize) {
        readable.push(data.subarray(0, maxSize - bytesRead));
        readable.push(null);
        bytesRead = maxSize;
        return;
      }

      readable.push(data);
      bytesRead += data.length;
    };

    const onEnd = () => {
      socket.off("data", onData);
      readable.push(null);
    };

    const onError = (error: Error) => {
      socket.off("data", onData);
      readable.destroy(error);
    };

    const onClose = (hadError: boolean) => {
      socket.off("data", onData);
      readable.destroy(
        new Error(
          hadError
            ? "Connection closes due to a transmission error."
            : "Connection was closed by the console.",
        ),
      );
    };

    socket.on("data", onData);
    socket.once("end", onEnd);
    socket.once("error", onError);
    socket.once("close", onClose);

    return readable;
  };

  return { readLine, readBytes, streamRemainingData };
}
