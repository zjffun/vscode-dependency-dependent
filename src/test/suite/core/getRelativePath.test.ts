import * as assert from "assert";
import * as vscode from "vscode";
import getRelativePath from "../../../core/getRelativePath";

suite("getRelativePath", () => {
  setup(async () => {});

  teardown(async () => {});

  test("should work", async () => {
    const fromUri = vscode.Uri.file("src/test.ts");
    const toUri = vscode.Uri.file("src/testDir/test.ts");
    const relativePath = getRelativePath(fromUri, toUri);

    // TODO: fix when windows
    assert.equal(relativePath, "./testDir/test.ts");
  });
});
