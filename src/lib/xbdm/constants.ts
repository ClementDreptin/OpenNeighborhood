export const LINE_DELIMITER = "\r\n";

export const STATUS_CODES = {
  Ok: "200", // 200- <content>
  Connected: "201", // 201- connected
  MultilineResponseFollows: "202", // 202- multiline response follows
  BinaryResponseFollows: "203", // 203- binary response follows
} as const;

export type Status = keyof typeof STATUS_CODES;
