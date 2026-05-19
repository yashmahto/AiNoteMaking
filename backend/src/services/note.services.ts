// src/services/note.service.ts
import { prisma } from "../lib/prisma.js";

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
      ...(status === "pending"   && { isCompleted: false }),
      ...(status === "completed" && { isCompleted: true  }),
    };
    return prisma.note.findMany({ where, orderBy: { updatedAt: "desc" } });
  }

  async search(userId: string, keyword: string) {
    return prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title:   { contains: keyword, mode: "insensitive" } },
          { content: { contains: keyword, mode: "insensitive" } },
        ],
      },
    });
  }

  async update(userId: string, noteId: string, data: { title?: string; content?: string; appendMode?: boolean }) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error("Note not found");

    const newContent = data.appendMode && data.content
      ? `${note.content}\n${data.content}`
      : data.content;

    return prisma.note.update({
      where: { id: noteId },
      data: { title: data.title, content: newContent },
    });
  }

  async markCompleted(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error("Note not found");
    return prisma.note.update({ where: { id: noteId }, data: { isCompleted: true } });
  }

  async delete(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error("Note not found");
    return prisma.note.delete({ where: { id: noteId } });
  }
}
