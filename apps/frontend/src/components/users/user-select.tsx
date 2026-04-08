'use client'

type AssignableUser = {
  id: number
  name: string | null
}

export function UserSelect({
  users,
  value,
  onChange,
}: {
  users: AssignableUser[]
  value?: string | null
  onChange: (value: string) => void
}) {
  return (
    <select
      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.id} value={String(user.id)}>
          {user.name ?? user.id}
        </option>
      ))}
    </select>
  )
}
