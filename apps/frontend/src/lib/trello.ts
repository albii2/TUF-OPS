const TRELLO_API_BASE = 'https://api.trello.com/1'

type CreateTrelloCardInput = {
  name: string
  description: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function trelloRequest(path: string, method: 'POST' | 'PUT') {
  const key = getRequiredEnv('TRELLO_API_KEY')
  const token = getRequiredEnv('TRELLO_API_TOKEN')

  const separator = path.includes('?') ? '&' : '?'
  const url = `${TRELLO_API_BASE}${path}${separator}key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Trello request failed (${response.status}): ${body}`)
  }

  return response.json()
}

export async function createMockupTrelloCard(input: CreateTrelloCardInput) {
  const listId = getRequiredEnv('TRELLO_MOCKUP_LIST_ID')

  const params = new URLSearchParams({
    idList: listId,
    name: input.name,
    desc: input.description,
    pos: 'top',
  })

  return trelloRequest(`/cards?${params.toString()}`, 'POST') as Promise<{ id: string; url: string; name: string }>
}

export async function archiveTrelloCard(cardId: string) {
  const params = new URLSearchParams({ closed: 'true' })
  return trelloRequest(`/cards/${encodeURIComponent(cardId)}?${params.toString()}`, 'PUT')
}

export function getTrelloCardIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const cardIndex = parsed.pathname.split('/').findIndex((segment) => segment === 'c')
    if (cardIndex === -1) return null

    const cardId = parsed.pathname.split('/')[cardIndex + 1]
    return cardId || null
  } catch {
    return null
  }
}
