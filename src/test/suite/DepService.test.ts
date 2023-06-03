import * as assert from "assert";
import * as vscode from "vscode";
import { DepService } from "../../DepService";
import { sleep, testWorkspaceRoot } from "../util";

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

    await sleep(1000);

    const depService = new DepService();
    const dependentMap = await depService.getDependentMapByWorkspace(
      vscode.workspace.getWorkspaceFolder(testWorkspaceRoot)
    );

    console.log(
      "DepService.test.ts:33",
      uri.path,

      JSON.stringify(
        dependentMap,
        (key, val) => {
          if (val instanceof Set) {
            return Array.from(val);
          }
          if (val instanceof Map) {
            return Array.from(val.entries());
          }
          return val;
        },
        2
      )
    );

    assert.equal(dependentMap.get(uri.path)?.size, 1);
  });

  test("getDependency should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    await vscode.commands.executeCommand("vscode.open", uri);

    await sleep(1000);

    const dependencies = await depService.getDependencies(uri);

    assert.equal(dependencies.length, 3);
  });

  test("getDependent should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    await vscode.commands.executeCommand("vscode.open", uri);

    await sleep(1000);

    const dependents = await depService.getDependents(uri);

    assert.equal(dependents.length, 1);
  });
});
