import Fastify from "fastify";
import { parseMealText } from "./parsing/mealParser.js";
import { searchNutrition } from "./nutrition/israeliNutrition.js";

const server = Fastify({ logger: true });

server.get("/api/health", async () => ({ ok: true }));

server.get<{ Querystring: { q?: string } }>("/api/nutrition/search", async (request, reply) => {
  const query = request.query.q?.trim();
  if (!query) return reply.code(400).send({ error: "Missing q" });
  return searchNutrition(query);
});

server.post<{ Body: { text?: string } }>("/api/meals/parse", async (request, reply) => {
  const text = request.body.text?.trim();
  if (!text) return reply.code(400).send({ error: "Missing text" });
  return parseMealText(text);
});

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "0.0.0.0";

server.listen({ port, host }).catch((error) => {
  server.log.error(error);
  process.exit(1);
});
