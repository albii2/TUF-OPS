export type AppRole = 'admin' | 'director' | 'rep'

export type AppSessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: AppRole
  managerId?: string | null
}

export type AppSession = {
  user: AppSessionUser
}
