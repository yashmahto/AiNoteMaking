import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { NoteService } from "../services/note.services.js";

const noteService = new NoteService();

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const status = (req.query.status as "all" | "pending" | "completed") || "all";
    const search = req.query.search as string | undefined;

    let notes;
    if (search && search.trim()) {
      notes = await noteService.search(userId, search.trim());
    } else {
      notes = await noteService.getAll(userId, status);
    }

    res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, content, tags } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const note = await noteService.create(userId, {
      title: title.trim(),
      content: content || "",
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { title, content, appendMode } = req.body;

    const note = await noteService.update(userId, id, { title, content, appendMode });
    res.status(200).json({ success: true, note });
  } catch (error: any) {
    if (error.message === "Note not found") {
      res.status(404).json({ success: false, message: "Note not found" });
      return;
    }
    console.error("Update note error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    await noteService.delete(userId, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "Note not found") {
      res.status(404).json({ success: false, message: "Note not found" });
      return;
    }
    console.error("Delete note error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markNoteComplete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const note = await noteService.markCompleted(userId, id);
    res.status(200).json({ success: true, note });
  } catch (error: any) {
    if (error.message === "Note not found") {
      res.status(404).json({ success: false, message: "Note not found" });
      return;
    }
    console.error("Mark complete error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
