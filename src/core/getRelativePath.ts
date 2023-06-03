import * as path from "path";
import * as vscode from "vscode";

export default function (fromUri?: vscode.Uri, toUri?: vscode.Uri) {
  if (!fromUri?.fsPath || !toUri?.fsPath) {
    return "";
  }

  const relativePath = path
    .relative(path.dirname(fromUri.fsPath), toUri.fsPath)
    .replaceAll(path.sep, "/");

  if (!relativePath.startsWith(".")) {
    return `./${relativePath}`;
  }

  return relativePath;
}
