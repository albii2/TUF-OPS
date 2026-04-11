const loggedOperations = new Set<string>()

function logDatabaseWarning(operationName: string, error?: unknown) {
  const key = error ? `${operationName}:error` : `${operationName}:env`
  if (loggedOperations.has(key)) return
  loggedOperations.add(key)

  if (!error) {
    console.warn(`[db-health] ${operationName} skipped because DATABASE_URL is not configured.`)
    return
  }

  console.warn(`[db-health] ${operationName} using fallback due to database initialization error.`, error)
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

function isDatabaseInitializationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as { name?: string; message?: string }
  return (
    maybeError.name === 'PrismaClientInitializationError' ||
    maybeError.message?.includes('Environment variable not found: DATABASE_URL') === true
  )
}

export async function withDatabaseFallback<T>(
  operationName: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isDatabaseConfigured()) {
    logDatabaseWarning(operationName)
    return fallback
  }

  try {
    return await run()
  } catch (error) {
    if (isDatabaseInitializationError(error)) {
      logDatabaseWarning(operationName, error)
      return fallback
    }
    throw error
  }
}
