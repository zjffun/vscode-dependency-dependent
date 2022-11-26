import * as assert from "assert";
import * as vscode from "vscode";
import getStatsModules from "../../../core/getStatsModules";
import { testWorkspaceRoot } from "../../util";

suite("getStatsModules", () => {
  setup(async () => {});

  teardown(async () => {});

  test("should work", async () => {
    const statsModules = await getStatsModules(testWorkspaceRoot);

    assert.ok(statsModules.length > 0);
  });
});
