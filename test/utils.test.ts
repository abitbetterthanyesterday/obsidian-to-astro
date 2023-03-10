import {
  afterEach,
  assertEquals,
  beforeEach,
  describe,
  it,
  join,
} from "../deps.ts";
import {
  createBackup,
  findFilesRecursively,
  prepareDestDirectory,
} from "../lib/utils.ts";

describe("Retrieveing the notes", () => {
  it("retrieves the notes recursively within a directory", async () => {
    const files = await findFilesRecursively("test/__fixtures__/source");
    assertEquals(files.length, 6);
  });

  it("can take a regexp as an option and filter the files based on whether or not they match the regexp", async () => {
    const markdownRegexp = /.*\.md/;
    const files = await findFilesRecursively("test/__fixtures__/source", {
      match: markdownRegexp,
    });
    assertEquals(files.length, 5);
  });
});

describe("Preparing the destination directory", () => {
  let tempDir: string;
  beforeEach(() => {
    tempDir = Deno.makeTempDirSync();
  });
  afterEach(() => {
    Deno.remove(tempDir, { recursive: true });
  });
  it("should remove all files from the destination directory", () => {
    Deno.createSync(join(tempDir, "foo.txt")).close();
    Deno.createSync(join(tempDir, "bar.txt")).close();
    Deno.createSync(join(tempDir, "foobar.txt")).close();
    let filesCount = [...Deno.readDirSync(tempDir)].length;
    assertEquals(filesCount, 3);

    prepareDestDirectory(tempDir);

    filesCount = [...Deno.readDirSync(tempDir)].length;
    assertEquals(filesCount, 0);
  });
});

describe("Safety features", () => {
  let sourceDir: string;
  let destinationDir: string;
  let backupDir: string;

  beforeEach(() => {
    sourceDir = Deno.makeTempDirSync();
    Deno.createSync(join(sourceDir, "foo.txt")).close();
    destinationDir = Deno.makeTempDirSync();
    Deno.createSync(join(destinationDir, "foo.txt")).close();
    backupDir = Deno.makeTempDirSync();
  });
  // Cleanup
  afterEach(() => {
    Deno.remove(sourceDir, { recursive: true });
    Deno.remove(destinationDir, { recursive: true });
    Deno.remove(backupDir, { recursive: true });
  });
  it("should create a backup of both the source and the destination directories", async () => {
    assertEquals([...Deno.readDirSync(backupDir)].length, 0);
    const uniqueBackupDir = await createBackup(
      sourceDir,
      destinationDir,
      backupDir,
    );

    // Main backup dir
    assertEquals([...Deno.readDirSync(backupDir)].length, 1);
    // Unique backup dir
    assertEquals([...Deno.readDirSync(uniqueBackupDir)].length, 2);
    // Destination + Source backups
    assertEquals(
      [...Deno.readDirSync(join(uniqueBackupDir, "source"))].length,
      1,
    );
    assertEquals(
      [...Deno.readDirSync(join(uniqueBackupDir, "destination"))].length,
      1,
    );
  });
});
