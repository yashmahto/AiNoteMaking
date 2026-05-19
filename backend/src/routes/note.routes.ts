import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  markNoteComplete,
} from "../controllers/note.controller.js";

const router = Router();

router.get("/", protect, getNotes);
router.post("/", protect, createNote);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.patch("/:id/complete", protect, markNoteComplete);

export default router;
