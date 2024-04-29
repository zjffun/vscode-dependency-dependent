import * as vscode from "vscode";

const lockContextId = "dependency-dependent.lock";
const loadingContextId = "dependency-dependent.loading";

let locked = false;
let loading = false;

async function setLocked(val) {
  await vscode.commands.executeCommand("setContext", lockContextId, val);
  locked = val;
}

function getLocked() {
  return locked;
}

async function setLoading(val) {
  await vscode.commands.executeCommand("setContext", loadingContextId, val);
  loading = val;
}

function getLoading() {
  return loading;
}

export { setLocked, getLocked, setLoading, getLoading };
