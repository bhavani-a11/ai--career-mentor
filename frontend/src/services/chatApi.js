import api from "./api";

/**
 * Sends the user's message to FastAPI POST /chat and returns the AI reply.
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sendChatMessage(message) {
  const { data } = await api.post("/chat", { message });
  return data.reply;
}
