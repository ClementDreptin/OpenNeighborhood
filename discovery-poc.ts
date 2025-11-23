import dgram from "node:dgram";

interface UdpPacket {
  datagram: Buffer;
  remoteInfo: dgram.RemoteInfo;
}

async function broadcastUdpPacket(
  packet: Buffer,
  maxRetries = 3,
  retryDelay = 500,
) {
  function broadcast(): Promise<UdpPacket> {
    return new Promise((resolve, reject) => {
      const udp = dgram.createSocket("udp4");

      udp.bind(() => {
        udp.setBroadcast(true);
      });

      // You can't set a timeout socket option on a UDP socket so we implement
      // the timeout logic manually
      const timeoutId = setTimeout(() => {
        udp.close();
        reject(new Error("Timeout"));
      }, retryDelay);

      udp.send(packet, 730, "255.255.255.255", (error) => {
        if (error != null) {
          udp.close();
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      // TODO: add support for multiple messages to be received (needed when multiple consoles respond)
      udp.once("message", (datagram, remoteInfo) => {
        udp.close();
        clearTimeout(timeoutId);
        resolve({ remoteInfo, datagram });
      });

      udp.once("error", (error) => {
        udp.close();
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  // UDP is unreliable so we retry maxRetries times before erroring
  let lastError;
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      return await broadcast();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function discoverConsoleByName(consoleName: string) {
  // https://xboxdevwiki.net/Xbox_Debug_Monitor#Name_Answering_Protocol (Forward Lookup)
  const type1 = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from([consoleName.length]),
    Buffer.from(consoleName, "ascii"),
  ]);

  const { remoteInfo, datagram } = await broadcastUdpPacket(type1);
  const receivedConsoleName = datagram.subarray(2).toString("ascii");

  // This should never happen but just in case
  if (receivedConsoleName !== consoleName) {
    throw new Error(
      `Incorrect console name, expected "${consoleName}" but received "${receivedConsoleName}".`,
    );
  }

  return {
    ipAddress: remoteInfo.address,
    name: receivedConsoleName,
  };
}

async function discoverAllConsoles() {
  // https://xboxdevwiki.net/Xbox_Debug_Monitor#Name_Answering_Protocol (Console Discovery)
  const type3 = Buffer.from([0x03, 0x00]);

  const { remoteInfo, datagram } = await broadcastUdpPacket(type3);

  // TODO: add support for multiple consoles
  return {
    ipAddress: remoteInfo.address,
    name: datagram.subarray(2).toString("ascii"),
  };
}

discoverConsoleByName("devkit").then(console.log).catch(console.error);
discoverAllConsoles().then(console.log).catch(console.error);
