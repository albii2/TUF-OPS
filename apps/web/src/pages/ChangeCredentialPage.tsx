import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/primitives';
import { getStoredUser, updateStoredUser } from '../auth';
import { changeOwnCredential } from '../services/usersService';

export function ChangeCredentialPage({ setUser }: { setUser: (u: any) => void }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [currentCredential, setCurrentCredential] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updated = await changeOwnCredential(user.id, currentCredential, newCredential);
      const nextUser = updateStoredUser({ ...user, mustChangeCredential: updated.mustChangeCredential });
      setUser(nextUser);
      navigate('/dashboard');
    } catch (error: any) {
      setMessage(error.message || 'Unable to change credential');
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card title="Change PIN/Password">
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-slate-300">This user must change their credential on first login.</p>
          <Input placeholder="Current temporary credential" value={currentCredential} onChange={(e) => setCurrentCredential(e.target.value.replace(/\D/g, ''))} />
          <Input placeholder="New credential" value={newCredential} onChange={(e) => setNewCredential(e.target.value.replace(/\D/g, ''))} />
          <Button type="submit">Change Credential</Button>
          {message ? <p className="text-sm text-rose-300">{message}</p> : null}
        </form>
      </Card>
    </div>
  );
}
