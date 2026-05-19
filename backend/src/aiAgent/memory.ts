import { Content } from "@google/generative-ai";

class MemoryStore {
  private historyMap = new Map<string, Content[]>();
  private readonly MAX_TURNS = 10; // 5 user messages + 5 model responses

  getHistory(userId: string): Content[] {
    return this.historyMap.get(userId) || [];
  }

  setHistory(userId: string, history: Content[]): void {
    // Keep only the last MAX_TURNS parts
    if (history.length > this.MAX_TURNS) {
      history = history.slice(-this.MAX_TURNS);
    }
    this.historyMap.set(userId, history);
  }

  clearHistory(userId: string): void {
    this.historyMap.delete(userId);
  }
}

export const memoryStore = new MemoryStore();
