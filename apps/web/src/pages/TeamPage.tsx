import { useMemo, useState } from 'react';
import { Button, Card, DataTable, EmptyState, Input, Modal, Select, type Column } from '../components/primitives';
import { getStoredUser } from '../auth';
import { teamMembers, type TeamMember, type TerritoryId } from '../data/mockSalesData';

export function TeamPage() {
  const user = getStoredUser();
  const [members, setMembers] = useState(teamMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const canManageTeam = user?.role === 'OWNER' || user?.role === 'DIRECTOR';

  const columns: Column<TeamMember>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'role', header: 'Role', cell: (r) => r.role },
    { key: 'territories', header: 'Territories', cell: (r) => r.territoryIds.join(', ') },
    { key: 'active', header: 'Status', cell: (r) => (r.active ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setSelectedMember(r);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          {user?.role === 'OWNER' && (
            <Button
              onClick={() => {
                setMembers(members.filter((m) => m.id !== r.id));
              }}
            >
              Remove
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!canManageTeam) {
    return <Card title="Team Members"><p>You do not have permission to view this page.</p></Card>;
  }

  return (
    <div className="space-y-3">
      <Card title="Team Members">
        <DataTable columns={columns} rows={members} />
      </Card>

      {isModalOpen && selectedMember && (
        <Modal title={`Edit ${selectedMember.name}`} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <Select
                value={selectedMember.role}
                onChange={(e) => {
                  setSelectedMember({ ...selectedMember, role: e.target.value as TeamMember['role'] });
                }}
              >
                <option value="OWNER">OWNER</option>
                <option value="DIRECTOR">DIRECTOR</option>
                <option value="REP">REP</option>
                <option value="OPS">OPS</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Territories</label>
              <Input
                value={selectedMember.territoryIds.join(', ')}
                onChange={(e) => {
                  setSelectedMember({ ...selectedMember, territoryIds: e.target.value.split(', ').map((t) => t.trim()) as TerritoryId[] });
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setMembers(members.map((m) => (m.id === selectedMember.id ? selectedMember : m)));
                  setIsModalOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
