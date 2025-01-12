export const LINE_DELIMITER = "\r\n";

export const STATUS_CODES = {
  Ok: "200",
  Connected: "201",
  MultilineResponseFollows: "202",
  BinaryResponseFollows: "203",
} as const;

export type Status = keyof typeof STATUS_CODES;
