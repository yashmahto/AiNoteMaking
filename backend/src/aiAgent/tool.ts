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
  description: "Updates an existing note by its UUID or by title/topic keywords",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      noteId: { type: SchemaType.STRING, description: "The UUID or title/keyword of the note to update" },
      query: { type: SchemaType.STRING, description: "The title or keyword of the note to update (optional if noteId is provided)" },
      title: { type: SchemaType.STRING, description: "New title (optional)" },
      content: { type: SchemaType.STRING, description: "New or appended content (optional)" },
      appendMode: { type: SchemaType.BOOLEAN, description: "If true, append content instead of replacing it (optional)" },
    },
  },
};

const markCompletedDeclaration: FunctionDeclaration = {
  name: "mark_completed",
  description: "Marks an existing note as completed/done. Accepts either the note UUID (noteId) OR the note's title or topic keywords (query, e.g. 'dentist appointment', 'groceries', 'strawberries'). Automatic smart fuzzy matching will identify and check off the note.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      noteId: { type: SchemaType.STRING, description: "The UUID of the note if known, or title/keyword (optional)" },
      query: { type: SchemaType.STRING, description: "The title, keyword, or topic of the note to mark complete (e.g. 'dentist', 'groceries', 'strawberries')" },
    },
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
  description: "Searches the user's notes by keyword, topic, tag, or partial phrase (e.g. 'dentist', 'groceries', 'ideas'). Smart matching across titles, contents, and tags is applied.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: { type: SchemaType.STRING, description: "Keyword or phrase to search for" },
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
