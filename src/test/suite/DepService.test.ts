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

  test("getDependency should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    const statsModules = await depService.getDependencies(uri);

    assert.equal(statsModules.length, 2);
  });

  test("getDependent should work", async () => {
    const depService = new DepService();
    const uri = vscode.Uri.joinPath(testWorkspaceRoot, "src", "App.js");

    const statsModules = await depService.getDependents(uri);

    assert.equal(statsModules.length, 1);
  });
});
