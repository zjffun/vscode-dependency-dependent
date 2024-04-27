import * as vscode from "vscode";

const lockContextId = "dependency-dependent.lock";

let locked = false;

async function setLocked(val) {
  await vscode.commands.executeCommand("setContext", lockContextId, val);
  locked = val;
}

function getLocked() {
  return locked;
}

export { setLocked, getLocked };
