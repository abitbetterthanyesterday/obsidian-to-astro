// import { Note } from "./types.ts";
import { join } from "https://deno.land/std@0.171.0/path/mod.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/crypto.ts";
import {
  copySync,
  emptyDirSync,
} from "https://deno.land/std@0.177.0/fs/mod.ts";
import * as logger from "https://deno.land/std@0.177.0/log/mod.ts";

// export async function getAllProcessedNotes(directory: string): Promise<Note[]> {
//    const notes: Note[] = await findNotesInDirectoryRecursively(directory);
//    const processedNotes = await replaceWikilinks(notes.filter(({ frontmatter }) => frontmatter.status === 'publish'));
//    return processedNotes;
// }

/**
 * @param directory The directory to search. Note that the result will be base on this directory, so if you provide a relative path, the result will be relative.
 * @returns The list of files path
 */
type Options = {
  match: RegExp;
};

/**
 * Given a directory, find all the files matching the options provided and return their file paths.
 *
 * @param directory the directory to search
 * @param options options to filter the result. So far, the sole option is to provide a regexp to match.
 * @returns an array of filepath for the files matching the search options in the directory provided
 */
export async function findFilesRecursively(
  directory: string,
  options?: Options,
): Promise<string[]> {
  const files: string[] = [];
  const subdirs = await Deno.readDir(directory);

  for await (const subdir of subdirs) {
    const subdirPath = join(directory, subdir.name);
    if (subdir.isFile) {
      if (options?.match && !options.match.test(subdir.name)) {
        continue;
      }
      files.push(`${directory}/${subdir.name}`);
    } else {
      files.push(...(await findFilesRecursively(subdirPath, options)));
    }
  }
  return files;
}

/**
 * Prepare a backup of both the source and the destination folders
 * @param sourceDir source dir filepath
 * @param destinationDir  destination dir filepath
 * @param backupDir the location of the backups
 */
export function prepareBackups(
  sourceDir: string,
  destinationDir: string,
  backupDir: string,
): string {
  // Create a random backup dir
  const uniqueBackupDir = join(
    backupDir,
    new Date().toDateString(),
    crypto.randomUUID(),
  );
  prepareDestDirectory(uniqueBackupDir);

  try {
    copySync(sourceDir, join(uniqueBackupDir, "source"), { overwrite: true });
    copySync(destinationDir, join(uniqueBackupDir, "destination"), {
      overwrite: true,
    });
    logger.info(
      `"Backup successful. \n Backup directory: ${uniqueBackupDir}`,
    );
    return uniqueBackupDir;
  } catch (e) {
    logger.error(`Failed to prepare backup: \n ${e}`);
    throw new Error("Fail to prepare backups");
  }
}

/**
 * Prepare the destination directory:
 * Empty the directory of all files or create a new directory at the given path
 * @param dirPath the path of the directory to empty
 */
export function prepareDestDirectory(dirPath: string) {
  try {
    emptyDirSync(dirPath);
  } catch {
    Deno.mkdirSync(dirPath, { recursive: true });
  }
}

// async function parseFileIntoNote(filePath:string): Promise<Note | null> {
//    let content: string;
//    try {
//       content = await Deno.readTextFile(filePath);
//    } catch (e) {
//       console.error(e);
//       return null;
//    }

//   try {
//     const rawFrontmatter = parse(content.split("---")[1]) as Frontmatter;
//     const rawContent = content.split("---")[2] as string;
//     const frontmatter = {
//       ...rawFrontmatter,
//       created_at: new Date(rawFrontmatter.created_at),
//       last_modified_at: new Date(rawFrontmatter.last_modified_at),
//       description: rawContent.substring(0, 400).split(".").join("\n"),
//       slug: rawFrontmatter?.slug ??
//         rawFrontmatter.title.split(" ").join("-").toLowerCase(),
//     };
//     return {
//       title: basename(filePath),
//       filePath,
//       content,
//       publish: "---\n" + stringify(frontmatter) + "---\n" + rawContent,
//       frontmatter,
//     };
//   } catch (_e) {
//     console.warn(
//       `${
//         basename(
//           filePath,
//         )
//       } doesn't have a frontmatter and won't be published.`,
//     );
//     return null;
//   }
// }
