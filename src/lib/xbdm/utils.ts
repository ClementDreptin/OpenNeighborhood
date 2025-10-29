export function getStringProperty(line: string, propertyName: string) {
  // All string properties are like this: NAME="VALUE"

  // For the following example: drivename="HDD"

  const propertyStartIndex = line.indexOf(propertyName); // 0
  if (propertyStartIndex === -1) {
    throw new Error(`Property '${propertyName}' not found in ${line}.`);
  }

  const propertyEndIndex = propertyStartIndex + propertyName.length; // 9
  const equalIndex = line.indexOf("=", propertyEndIndex); // 9
  if (equalIndex === -1) {
    throw new Error(`Expected ${line} to contain '='.`);
  }
  if (equalIndex !== propertyEndIndex) {
    throw new Error(
      `Expected '=' to be right after the end of ${propertyName}.`,
    );
  }

  const firstQuoteIndex = line.indexOf('"', equalIndex); // 10
  if (firstQuoteIndex === -1) {
    throw new Error(`Expected ${line} to contain '"'.`);
  }
  if (firstQuoteIndex !== equalIndex + 1) {
    throw new Error("Expected first '\"' to be right after '='.");
  }

  const lastQuoteIndex = line.indexOf('"', firstQuoteIndex + 1); // 13
  if (lastQuoteIndex === -1) {
    throw new Error(`Expected ${line} to contain a second '"'.`);
  }

  return line.substring(firstQuoteIndex + 1, lastQuoteIndex);
}

export function getIntegerProperty(line: string, propertyName: string) {
  // All integer properties are like this: NAME=VALUE

  // For the following example: size=42

  const propertyStartIndex = line.indexOf(propertyName); // 0
  if (propertyStartIndex === -1) {
    throw new Error(`Property '${propertyName}' not found in ${line}.`);
  }

  const propertyEndIndex = propertyStartIndex + propertyName.length; // 4
  const equalIndex = line.indexOf("=", propertyEndIndex); // 4
  if (equalIndex === -1) {
    throw new Error(`Expected ${line} to contain '='.`);
  }
  if (equalIndex !== propertyEndIndex) {
    throw new Error(
      `Expected '=' to be right after the end of ${propertyName}.`,
    );
  }

  // The value ends when we encounter a space
  let valueEndIndex = line.indexOf(" ", equalIndex + 1);
  const commaIndex = line.indexOf(",", equalIndex + 1);
  if (valueEndIndex !== -1 && commaIndex === valueEndIndex - 1) {
    valueEndIndex = commaIndex;
  } else if (valueEndIndex === -1) {
    // If no spaces were found, the value ends at the end of the line
    valueEndIndex = line.length - 1; // 6
  }

  const valueString = line.substring(equalIndex + 1, valueEndIndex);
  const value = Number(valueString);
  if (Number.isNaN(value)) {
    throw new Error(`Couldn't convert ${valueString} into a number.`);
  }

  return value;
}

export function driveNameToDriveFriendlyName(driveName: string) {
  switch (driveName) {
    case "DEVKIT":
    case "E":
      return "Game Development Volume";
    case "HDD":
      return "Retail Hard Drive Emulation";
    case "Y":
      return "Xbox360 Dashboard Volume";
    case "Z":
      return "Devkit Drive";
    case "D":
    case "GAME":
      return "Active Title Media";
    default:
      return "Volume";
  }
}

export function filetimeToUnixTime(fileTime: number) {
  return fileTime / 10_000_000 - 11_644_473_600;
}

export function unixTimeToFiletime(unixTime: number) {
  return unixTime * 10_000_000 + 116_444_736_000_000_000;
}

export interface ScreenshotSpecs {
  pitch: number;
  width: number;
  height: number;
  format: number;
  offsetX: number;
  offsetY: number;
  framebufferSize: number;
}

export function deswizzleFramebuffer(
  framebuffer: Uint8Array,
  specs: ScreenshotSpecs,
): Uint8Array {
  const [signX, signY, signZ, signW] = getSign(specs.format);
  if (
    getTextureFormat(specs.format) !== gpuTextureFormat8888 ||
    getEndian(specs.format) !== gpuEndian8in32 ||
    !isTiled(specs.format) ||
    signX !== gpuSignUnsigned ||
    signY !== gpuSignUnsigned ||
    signZ !== gpuSignUnsigned ||
    signW !== gpuSignUnsigned
  ) {
    throw new Error(
      `Unsupported screenshot format: ${specs.format.toString(16)}`,
    );
  }

  const [swizzleX, swizzleY, swizzleZ] = getSwizzle(specs.format);

  const deswizzled = new Uint8Array(specs.width * specs.height * 4);

  for (let y = 0; y < specs.height; y++) {
    const tileYIdx = (y & xenosTileMask) * Math.floor(specs.pitch / 4);
    const pxYIdx = Math.floor((y & xenosInTileMask) / 2) * 64 + (y % 2) * 4;

    for (let x = 0; x < specs.width; x++) {
      const tileXIdx = Math.floor(x / xenosTileWH) * xenosTileWH * xenosTileWH;
      const pxXIdx =
        (Math.floor((x % xenosTileWH) / 4) * 8 + (x % 4)) ^ ((y & 8) << 2);
      const idx = tileYIdx + tileXIdx + pxYIdx + pxXIdx;

      const r = getCh(framebuffer, idx, swizzleX);
      const g = getCh(framebuffer, idx, swizzleY);
      const b = getCh(framebuffer, idx, swizzleZ);
      const a = 255;

      const pngIdx = (specs.width * y + x) * 4;

      deswizzled[pngIdx] = r;
      deswizzled[pngIdx + 1] = g;
      deswizzled[pngIdx + 2] = b;
      deswizzled[pngIdx + 3] = a;
    }
  }

  return deswizzled;
}

const gpuTextureFormat8888 = 6;

const gpuEndian8in32 = 2;

const gpuSignUnsigned = 0;

const gpuSwizzleX = 0;
const gpuSwizzleY = 1;
const gpuSwizzleZ = 2;
const gpuSwizzleW = 3;
const gpuSwizzle0 = 4;
const gpuSwizzle1 = 5;

const d3dFmtTextureFormatMask = 0x0000003f;
const d3dFmtEndianMask = 0x000000c0;
const d3dFmtTiledMask = 0x00000100;
const d3dFmtSignXMask = 0x00000600;
const d3dFmtSignYMask = 0x00001800;
const d3dFmtSignZMask = 0x00006000;
const d3dFmtSignWMask = 0x00018000;
const d3dFmtSwizzleXMask = 0x001c0000;
const d3dFmtSwizzleYMask = 0x00e00000;
const d3dFmtSwizzleZMask = 0x07000000;
const d3dFmtSwizzleWMask = 0x38000000;

const xenosTileWH = 32;
const xenosInTileMask = xenosTileWH - 1;
const xenosTileMask = ~xenosInTileMask;

function getTextureFormat(format: number) {
  return extract(format, d3dFmtTextureFormatMask);
}

function getEndian(format: number) {
  return extract(format, d3dFmtEndianMask);
}

function isTiled(format: number) {
  return extract(format, d3dFmtTiledMask) !== 0;
}

function getSign(format: number) {
  return [
    extract(format, d3dFmtSignXMask),
    extract(format, d3dFmtSignYMask),
    extract(format, d3dFmtSignZMask),
    extract(format, d3dFmtSignWMask),
  ];
}

function getSwizzle(format: number) {
  return [
    extract(format, d3dFmtSwizzleXMask),
    extract(format, d3dFmtSwizzleYMask),
    extract(format, d3dFmtSwizzleZMask),
    extract(format, d3dFmtSwizzleWMask),
  ];
}

function trailingZeros(n: number) {
  if (n === 0) {
    return 32;
  }

  let count = 0;

  while ((n & 1) === 0) {
    count++;
    n >>>= 1;
  }

  return count;
}

function extract(value: number, mask: number) {
  return (value & mask) >> trailingZeros(mask);
}

function getCh(pixelData: Uint8Array, idx: number, swizzle: number) {
  switch (swizzle) {
    case gpuSwizzleX:
    case gpuSwizzleY:
    case gpuSwizzleZ:
    case gpuSwizzleW:
      return pixelData[4 * idx + swizzle];
    case gpuSwizzle0:
      return 0;
    case gpuSwizzle1:
      return 255;
    default:
      throw new Error("invalid swizzle");
  }
}
