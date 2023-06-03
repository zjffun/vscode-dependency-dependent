import * as path from "path";
import * as vscode from "vscode";

export default function (fromUri?: vscode.Uri, toUri?: vscode.Uri) {
  if (!fromUri?.path || !toUri?.path) {
    return "";
  }

  const relativePath = vscode.Uri.file(
    path.relative(path.dirname(fromUri.path), toUri.path)
  ).path;

  if (!relativePath.startsWith(".")) {
    return `./${relativePath}`;
  }

  return relativePath;
}
