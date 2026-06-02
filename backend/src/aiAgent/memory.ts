import { Content } from "@google/generative-ai";

class MemoryStore {
  private historyMap = new Map<string, Content[]>();
  private readonly MAX_USER_TURNS = 5; // Keep the last 5 user-initiated conversation turns

  getHistory(userId: string): Content[] {
    return this.historyMap.get(userId) || [];
  }

  setHistory(userId: string, history: Content[]): void {
    // Find all indices where a new user-initiated conversation turn starts.
    // A new user turn starts with a message from the 'user' that is NOT a tool/function response.
    const userTurnIndices: number[] = [];
    for (let i = 0; i < history.length; i++) {
      const content = history[i];
      if (content.role === "user") {
        const hasFunctionResponse = content.parts && content.parts.some(
          (part) => "functionResponse" in part
        );
        if (!hasFunctionResponse) {
          userTurnIndices.push(i);
        }
      }
    }

    // Keep only the last MAX_USER_TURNS turns. Slicing at a user turn start ensures the first
    // message in the history is always from role 'user' and we do not break any function call/response pairs.
    if (userTurnIndices.length > this.MAX_USER_TURNS) {
      const sliceIndex = userTurnIndices[userTurnIndices.length - this.MAX_USER_TURNS];
      history = history.slice(sliceIndex);
    }
    this.historyMap.set(userId, history);
  }

  clearHistory(userId: string): void {
    this.historyMap.delete(userId);
  }
}

export const memoryStore = new MemoryStore();
