import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Carrega primeiro o arquivo usado pelo Next.js.
config({ path: ".env.local" });

// Mantém compatibilidade com um eventual arquivo .env.
config({ path: ".env" });

// Para migrations e comandos do Prisma, prioriza a conexão direta.
// Caso ela não exista, utiliza DATABASE_URL como alternativa.
const databaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL ou DATABASE_URL não foi encontrada. Verifique o arquivo .env.local.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});