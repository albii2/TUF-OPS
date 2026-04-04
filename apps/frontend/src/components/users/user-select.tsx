"use client";

import type { User } from "@prisma/client";

export function UserSelect({ 
    users, 
    value, 
    onChange,
    placeholder = "Select a user",
    disabled = false
}: {
    users: User[];
    value?: number | null;
    onChange: (value: number | null) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
            disabled={disabled}
        >
            <option value="">{placeholder}</option>
            {users.map((user) => (
                <option key={user.id} value={String(user.id)}>
                    {user.name}
                </option>
            ))}
        </select>
    );
}
