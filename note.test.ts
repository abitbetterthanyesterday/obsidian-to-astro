import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.173.0/testing/bdd.ts";

import { Note } from "./note.ts";
import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";

describe("Note class", () => {
  let note: Note;
  const filePath = "./_testFolder/note1.md";
  const filePathWithoutFrontmatter = "./_testFolder/noteWithoutFrontmatter.md";
  const fileContent = Deno.readTextFileSync(filePath);
  const onCreateNote = (_note: Note) => {/* do something with the note */};
  beforeEach(() => {
    note = new Note(filePath, onCreateNote);
  });
  it("should instantiate a Note object from a file path", () => {
    assertEquals(note.filePath, filePath);
    assertEquals(note.rawFile, fileContent);
  });

  it("should let me obtain the frontmatter", () => {
    const expected = {
      title: "hello world",
      created_at: new Date("2023-01-01 12:00"),
      last_modified_at: new Date("2023-01-01 18:00"),
      slug: "hello-world",
      status: "publish",
      tags: [
        "hello",
        "world",
      ],
    };
    assertEquals(expected, note.frontmatter);
  });

  it("should return null if there is no frontmatter", () => {
    const noteWithoutFrontMatter = new Note(
      filePathWithoutFrontmatter,
      onCreateNote,
    );
    const expected = null;
    noteWithoutFrontMatter.frontmatter === expected;
  });

  it("should let me obtain the note raw content", () => {
    const expected = `Hello world\nThis wiki link does no exist [[fake link]]`;
    assertEquals(note.rawContent, expected);
  });

  it("should emit an event on note creation", () => {
    let createdNote: Note;
    const expected = `Hello world\nThis wiki link does no exist [[fake link]]`;
    const onCreatedNote = (note: Note) => {
      createdNote = note;
    };
    note = new Note(filePath, onCreatedNote);
    // @ts-ignore: created Note is created as part of side effect
    assertEquals((createdNote as Note).filePath, filePath);
    // @ts-ignore: created Note is created as part of side effect
    assertEquals(createdNote.rawContent, expected);
  });
});
