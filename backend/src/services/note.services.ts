// src/services/note.services.ts
import { prisma } from "../lib/prisma.js";

// Helper to compute smart relevance score between a search query and a note
export function computeNoteRelevance(
  note: { title: string; content?: string | null; tags?: string[] | null },
  query: string
): number {
  if (!query || !query.trim()) return 0;

  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, " ").trim();
  const STOPWORDS = new Set([
    "the", "a", "an", "note", "notes", "my", "to", "for", "about",
    "task", "tasks", "item", "items", "please", "mark", "complete",
    "completed", "finish", "finished", "done", "check", "off", "as",
    "is", "i", "me", "want", "need", "that", "already", "there", "this",
    "show", "find", "search", "looking", "look", "and", "or", "in", "on"
  ]);

  const rawTokens = cleanQuery.split(/\s+/).filter((w) => w.length > 1);
  const meaningfulTokens = rawTokens.filter((w) => !STOPWORDS.has(w));
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  const titleLower = (note.title || "").toLowerCase();
  const contentLower = (note.content || "").toLowerCase();
  const tagsLower = (note.tags || []).map((t) => t.toLowerCase());

  let score = 0;

  // Exact phrase matches
  if (titleLower === cleanQuery) {
    score += 100;
  } else if (titleLower.includes(cleanQuery)) {
    score += 65;
  } else if (cleanQuery.includes(titleLower) && titleLower.length >= 3) {
    score += 55;
  }

  if (contentLower.includes(cleanQuery)) {
    score += 30;
  }

  for (const tag of tagsLower) {
    if (tag === cleanQuery || cleanQuery.includes(tag)) {
      score += 45;
    }
  }

  // Token-level and stem matches
  let matchedTokensCount = 0;
  for (const token of tokens) {
    let tokenMatched = false;

    // Title match
    if (titleLower.includes(token)) {
      score += 30;
      tokenMatched = true;
    } else {
      // Partial stem match (e.g., 'strawberr' in 'strawberries', 'grocer' in 'groceries')
      const stem = token.length > 4 ? token.slice(0, -2) : token;
      if (titleLower.includes(stem)) {
        score += 22;
        tokenMatched = true;
      }
    }

    // Tag match
    if (tagsLower.some((t) => t.includes(token))) {
      score += 28;
      tokenMatched = true;
    }

    // Content match
    if (contentLower.includes(token)) {
      score += 15;
      tokenMatched = true;
    }

    if (tokenMatched) {
      matchedTokensCount++;
    }
  }

  // Bonus when all query tokens matched
  if (tokens.length > 0 && matchedTokensCount === tokens.length) {
    score += 35;
  }

  return score;
}

export class NoteService {
  async create(userId: string, data: { title: string; content?: string; tags?: string[] }) {
    return prisma.note.create({
      data: {
        userId,
        title: data.title,
        content: data.content ?? "",
        tags: data.tags ?? [],
      },
    });
  }

  async getAll(userId: string, status: "all" | "pending" | "completed" = "all") {
    const where = {
      userId,
      ...(status === "pending" && { isCompleted: false }),
      ...(status === "completed" && { isCompleted: true }),
    };
    return prisma.note.findMany({ where, orderBy: { updatedAt: "desc" } });
  }

  // Smart resolution helper: accepts UUID, partial title, or keyword
  async resolveNote(userId: string, identifier: string, preferPending = false) {
    if (!identifier || !identifier.trim()) return null;
    const cleanId = identifier.trim();

    // 1. Try direct match by ID (UUID)
    try {
      const directNote = await prisma.note.findFirst({
        where: { id: cleanId, userId },
      });
      if (directNote) return directNote;
    } catch (e) {
      // Invalid UUID syntax is expected when identifier is a title/keyword phrase
    }

    // 2. Fetch all user notes to match by title / tags / content using relevance scoring
    const allNotes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (allNotes.length === 0) return null;

    const scoredNotes = allNotes
      .map((note) => {
        let score = computeNoteRelevance(note, cleanId);
        // Boost pending notes if we're looking to complete a task
        if (preferPending && !note.isCompleted) {
          score += 20;
        }
        return { note, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredNotes.length > 0) {
      return scoredNotes[0].note;
    }

    return null;
  }

  // Smart Search: ranks notes by fuzzy & semantic token matching
  async search(userId: string, keyword: string) {
    if (!keyword || !keyword.trim()) {
      return this.getAll(userId);
    }

    const allNotes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    const scoredNotes = allNotes
      .map((note) => ({
        note,
        score: computeNoteRelevance(note, keyword),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredNotes.length > 0) {
      return scoredNotes.map((item) => item.note);
    }

    // Fallback: substring search in database
    return prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { content: { contains: keyword, mode: "insensitive" } },
        ],
      },
    });
  }

  async update(
    userId: string,
    noteIdOrQuery: string,
    data: { title?: string; content?: string; appendMode?: boolean }
  ) {
    const note = await this.resolveNote(userId, noteIdOrQuery, false);
    if (!note) {
      throw new Error(`Note matching "${noteIdOrQuery}" not found`);
    }

    const newContent =
      data.appendMode && data.content
        ? `${note.content}\n${data.content}`
        : data.content ?? note.content;

    return prisma.note.update({
      where: { id: note.id },
      data: {
        title: data.title ?? note.title,
        content: newContent,
      },
    });
  }

  async markCompleted(userId: string, noteIdOrQuery: string) {
    const note = await this.resolveNote(userId, noteIdOrQuery, true);
    if (!note) {
      throw new Error(`Note matching "${noteIdOrQuery}" not found`);
    }
    return prisma.note.update({
      where: { id: note.id },
      data: { isCompleted: true },
    });
  }

  async delete(userId: string, noteIdOrQuery: string) {
    const note = await this.resolveNote(userId, noteIdOrQuery, false);
    if (!note) {
      throw new Error(`Note matching "${noteIdOrQuery}" not found`);
    }
    return prisma.note.delete({ where: { id: note.id } });
  }
}
