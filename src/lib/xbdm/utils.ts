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
  if (valueEndIndex === -1) {
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
