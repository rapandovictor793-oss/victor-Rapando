
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const generateLeagueSummary = async (players: Player[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const leaderboardContext = players.map(p => {
    const scores = p.scores.map(s => s.value).sort((a, b) => a - b);
    const bestTwo = scores.slice(0, 2);
    const total = bestTwo.reduce((a, b) => a + b, 0);
    return `${p.name}: Best 2 total = ${total} (Scores: ${p.scores.map(s => s.value).join(', ')})`;
  }).join('\n');

  const prompt = `
    You are a witty and slightly competitive golf league announcer for a WhatsApp group of old college alumni.
    Based on the following golf leaderboard (where LOWER scores are better), write a 3-sentence fun summary to post in the group.
    Mention the leader and give a gentle ribbing to someone who might need to practice more.
    Keep it friendly, professional, and perfect for a group chat.

    Leaderboard:
    ${leaderboardContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Leaderboard updated! Get back to the range!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Leaderboard updated! Great rounds everyone.";
  }
};
