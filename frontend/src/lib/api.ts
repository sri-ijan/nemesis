import axios from "axios";
import type { RivalryDoc, UserDoc } from "../types";

// In dev, Vite proxies /api to localhost:5000 (see vite.config.ts).
// In production, set VITE_API_URL to the deployed backend's full URL
// (e.g. https://nemesis-backend.onrender.com/api) as an env var on Vercel.
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({ baseURL: API_BASE });

// Checks if a CF handle exists before we create a user with it — catches
// typos early with a clear message instead of a confusing 500 later.
export async function verifyHandle(handle: string): Promise<{ valid: boolean; rating?: number }> {
  const { data } = await api.get(`/users/verify-handle/${encodeURIComponent(handle)}`);
  return data;
}

export async function createUser(payload: {
  displayName: string;
  codeforcesHandle?: string;
}): Promise<UserDoc> {
  const { data } = await api.post("/users", payload);
  return data;
}

export async function syncUser(userId: string): Promise<UserDoc> {
  const { data } = await api.post(`/users/${userId}/sync`);
  return data;
}

export async function createRivalry(userAId: string, userBId: string) {
  const { data } = await api.post("/rivalries", { userAId, userBId });
  return data;
}

export async function getRivalry(rivalryId: string): Promise<RivalryDoc> {
  const { data } = await api.get(`/rivalries/${rivalryId}`);
  return data;
}

// Triggers Gemini to generate a fresh recap + tip and persist it.
export async function generateNarrative(rivalryId: string, triggerContest?: string) {
  const { data } = await api.post(`/rivalries/${rivalryId}/narrative`, {
    triggerContest,
  });
  return data;
}