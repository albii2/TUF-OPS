'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StageProgress } from '@/components/stage-progress'

interface Note {
  id: number;
  note: string;
  created_at: string;
  user: { full_name: string };
}

interface Activity {
  id: number;
  activity_type: string;
  notes: string;
  created_at: string;
  user: { full_name: string };
}

interface Opportunity {
  id: number
  name: string
  stage: string
  estimated_value: number
  probability: number
  organization: {
    id: number
    name: string
  }
  opportunity_notes: Note[];
  rep_activities: Activity[];
}

const TUF_STAGES = [
  'Prospect',
  'Engage',
  'Design the Win',
  'Prove the Gear',
  'Invoice & Secure Payment',
  'Commit to the Team',
  'Execute the Order',
  'Expand the Program'
];

export default function OpportunityDetailPage() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('');
  const params = useParams()
  const router = useRouter()
  const id = params.id

  useEffect(() => {
    async function fetchOpportunity() {
      if (!id) return
      try {
        const response = await fetch(`/api/opportunities/${id}`)
        if (response.ok) {
          const data = await response.json()
          setOpportunity(data)
        }
      } catch (error) {
        console.error('Failed to fetch opportunity', error)
      }
      setLoading(false)
    }
    fetchOpportunity()
  }, [id])

  const handleStageChange = async (newStage: string) => {
    if (!opportunity) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...opportunity, stage: newStage })
        }
      );

      if (response.ok) {
        setOpportunity(prev => prev ? { ...prev, stage: newStage } : null);
      } else {
        console.error('Failed to update stage');
      }
    } catch (error) {
      console.error('Failed to update stage', error);
    }
  };
  
  const handleAddNote = async () => {
    if (!opportunity || !newNote.trim()) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunity_id: opportunity.id, note: newNote }),
      });

      if (response.ok) {
        const createdNote = await response.json();
        setOpportunity(prev => prev ? { ...prev, opportunity_notes: [...prev.opportunity_notes, createdNote] } : null);
        setNewNote('');
      } else {
        console.error('Failed to add note');
      }
    } catch (error) {
      console.error('Failed to add note', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>
  }

  if (!opportunity) {
    return <p>Opportunity not found</p>
  }

  const currentIndex = TUF_STAGES.indexOf(opportunity.stage);
  const nextStage = currentIndex < TUF_STAGES.length - 1 ? TUF_STAGES[currentIndex + 1] : null;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">{opportunity.name}</h1>
      <p className="text-xl text-gray-500 mb-6">{opportunity.organization.name}</p>

      <div className="mb-8">
        <StageProgress currentStage={opportunity.stage} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Stage:</strong> {opportunity.stage}</p>
                <p><strong>Estimated Value:</strong> ${opportunity.estimated_value}</p>
                <p><strong>Probability:</strong> {opportunity.probability}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunity.rep_activities.map(activity => (
                  <div key={activity.id} className="text-sm">
                    <p><span className="font-semibold">{activity.user.full_name}</span> logged <span className="font-semibold">{activity.activity_type}</span></p>
                    {activity.notes && <p className="pl-4 text-gray-600">- {activity.notes}</p>}
                    <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            {nextStage && (
              <Button onClick={() => handleStageChange(nextStage)}>
                Move to: {nextStage}
              </Button>
            )}
            <Button variant="outline" onClick={() => alert('Requesting Mockup...')}>Request Mockup</Button>
            <Button variant="outline" onClick={() => alert('Sending Sample...')}>Send Sample</Button>
            <Button onClick={() => alert('Creating Invoice...')}>Create Invoice</Button>
            {(currentIndex >= 5) && 
              <Button variant="destructive" onClick={() => alert('Starting Order...')}>Start Uniform Order</Button>
            }
          </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {opportunity.opportunity_notes.map(note => (
                  <div key={note.id} className="text-sm">
                    <p>{note.note}</p>
                    <p className="text-xs text-gray-400">- {note.user.full_name} on {new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a new note..." />
                <Button onClick={handleAddNote} size="sm">Add Note</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
