import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

const createNoteDeclaration: FunctionDeclaration = {
  name: "create_note",
  description: "Creates a new note for the user",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Short, descriptive note title" },
      content: { type: SchemaType.STRING, description: "The note body/content (optional)" },
      tags: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Relevant tags e.g. ['study', 'work'] (optional)"
      },
    },
    required: ["title"],
  },
};

const updateNoteDeclaration: FunctionDeclaration = {
  name: "update_note",
  description: "Updates an existing note by its ID",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      noteId: { type: SchemaType.STRING, description: "The exact UUID of the note to update" },
      title: { type: SchemaType.STRING, description: "New title (optional)" },
      content: { type: SchemaType.STRING, description: "New or appended content (optional)" },
      appendMode: { type: SchemaType.BOOLEAN, description: "If true, append content instead of replacing it (optional)" },
    },
    required: ["noteId"],
  },
};

const markCompletedDeclaration: FunctionDeclaration = {
  name: "mark_completed",
  description: "Marks a note as completed by its ID",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      noteId: { type: SchemaType.STRING, description: "The UUID of the note to mark as completed" },
    },
    required: ["noteId"],
  },
};

const getNotesDeclaration: FunctionDeclaration = {
  name: "get_notes",
  description: "Retrieves all notes, optionally filtered by completion status ('all', 'pending', 'completed')",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      status: {
        type: SchemaType.STRING,
        description: "Filter by status: 'all', 'pending', or 'completed' (optional)"
      },
    },
  },
};

const searchNotesDeclaration: FunctionDeclaration = {
  name: "search_notes",
  description: "Searches notes by keyword in title or content",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: { type: SchemaType.STRING, description: "Keyword to search for" },
    },
    required: ["keyword"],
  },
};

export const agentTools = [
  {
    functionDeclarations: [
      createNoteDeclaration,
      updateNoteDeclaration,
      markCompletedDeclaration,
      getNotesDeclaration,
      searchNotesDeclaration,
    ],
  },
];
