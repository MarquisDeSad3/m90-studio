import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

// In local dev (or first-boot environments) we may not have a DB yet. Defer
// the connection error until something actually queries `db` so the app can
// still render its public, DB-less landing page.
const client = connectionString
  ? postgres(connectionString, { max: 5, prepare: false })
  : (null as unknown as ReturnType<typeof postgres>)

export const db = connectionString
  ? drizzle(client, { schema })
  : new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
      get() {
        throw new Error(
          "DATABASE_URL is not set — database access is disabled until env is configured.",
        )
      },
    })

export * as dbSchema from "./schema"
