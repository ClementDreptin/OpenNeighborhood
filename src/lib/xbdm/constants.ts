export const LINE_DELIMITER = "\r\n";

export const STATUS_CODES = {
  Ok: "200", // 200- <content>
  Connected: "201", // 201- connected
  MultilineResponseFollows: "202", // 202- multiline response follows
  BinaryResponseFollows: "203", // 203- binary response follows
  SendBinaryData: "204", // 204- send binary data
  FileAlreadyExists: "410", // 410- file already exists
} as const;

export type Status = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];
