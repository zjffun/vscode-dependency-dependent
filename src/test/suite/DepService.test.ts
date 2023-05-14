import * as assert from "assert";
import * as vscode from "vscode";
import { DepService } from "../../DepService";
import { testWorkspaceRoot } from "../util";

suite("DepService", () => {
  setup(async () => {});

  teardown(async () => {});

  test("constructor should work", async () => {
    const depService = new DepService();
    assert.ok(depService);
  });

  test("getDependentMapByWorkspace should work", async () => {
    const uri = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "src",
      "vue",
      "Component.vue"
    );

    await vscode.commands.executeCommand("vscode.open", uri);

    const depService = new DepService();
    const dependentMap = await depService.getDependentMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(testWorkspaceRoot)
    );

    assert.equal(dependentMap.get(uri.path)?.size, 1);
  });

  test("getDependency should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    await vscode.commands.executeCommand("vscode.open", uri);

    const dependencies = await depService.getDependencies(uri);

    // TODO: fix when windows
    assert.equal(dependencies.length, 3);
  });

  test("getDependent should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    await vscode.commands.executeCommand("vscode.open", uri);

    const dependents = await depService.getDependents(uri);

    // TODO: fix when windows
    assert.equal(dependents.length, 1);
  });
});
