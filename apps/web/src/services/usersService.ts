import type { Role } from '../types';
import { teamMembers, type TerritoryId } from '../data/mockSalesData';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: Role;
  territory: TerritoryId | '';
  assignedDirectorId?: string;
  status: UserStatus;
  avatarColor: string;
};

const KEY = 'tuf_ops_users_v1';
const COLORS = ['#1FB6FF', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function seedUsers(): ManagedUser[] {
  return teamMembers.map((m, idx) => {
    const [firstName = m.name, lastName = ''] = m.name.split(' ');
    return {
      id: m.id,
      firstName,
      lastName,
      displayName: m.name,
      role: m.role,
      territory: m.territoryIds[0] ?? '',
      assignedDirectorId: m.role === 'REP' ? 'u-director' : undefined,
      status: m.active ? 'ACTIVE' : 'INACTIVE',
      avatarColor: COLORS[idx % COLORS.length],
    };
  });
}

export function listUsers(): ManagedUser[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const seeded = seedUsers();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return JSON.parse(raw) as ManagedUser[]; } catch { return seedUsers(); }
}

export function saveUsers(rows: ManagedUser[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function createUser(input: Omit<ManagedUser, 'id' | 'displayName' | 'avatarColor'>) {
  const rows = listUsers();
  const displayName = `${input.firstName} ${input.lastName}`.trim();
  if (!displayName) throw new Error('Display name required');
  if (rows.some((u) => u.displayName.toLowerCase() === displayName.toLowerCase())) throw new Error('User with this name already exists');
  if (input.role === 'REP' && !input.assignedDirectorId) throw new Error('Reps must be assigned to a director');
  const row: ManagedUser = {
    ...input,
    id: `u-local-${Date.now()}`,
    displayName,
    avatarColor: COLORS[rows.length % COLORS.length],
  };
  saveUsers([row, ...rows]);
  return row;
}

export function updateUser(id: string, patch: Partial<ManagedUser>) {
  const users = listUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (target.role === 'OWNER' && patch.status === 'INACTIVE') {
    const activeOwners = users.filter((u) => u.role === 'OWNER' && u.status === 'ACTIVE');
    if (activeOwners.length <= 1) throw new Error('Cannot archive the last active owner');
  }
  const rows = users.map((u) => (u.id === id ? { ...u, ...patch, displayName: `${patch.firstName ?? u.firstName} ${patch.lastName ?? u.lastName}`.trim() } : u));
  saveUsers(rows);
}

export function getActiveUserByRole(role: Role): ManagedUser | undefined {
  return listUsers().find((u) => u.role === role && u.status === 'ACTIVE');
}

export function avatarInitials(displayName: string) { return initials(displayName); }
