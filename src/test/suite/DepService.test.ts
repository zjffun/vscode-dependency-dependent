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
    const depService = new DepService();
    const dependentMap = await depService.getDependentMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(testWorkspaceRoot)
    );

    const vueComponentPath = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "src",
      "vue",
      "Component.vue"
    ).path;

    assert.equal(dependentMap.get(vueComponentPath)?.size, 1);
  });

  test("getDependency should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    const dependencies = await depService.getDependencies(uri);

    assert.equal(dependencies.length, 4);
  });

  test("getDependent should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    const dependents = await depService.getDependents(uri);

    assert.equal(dependents.length, 1);
  });
});
