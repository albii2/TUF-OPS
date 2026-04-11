'use client'

import { useState } from 'react';
import { Mockup } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTransition } from 'react';

interface Props {
    opportunityId: number;
    initialMockup: Mockup | null;
}

export function MockupWorkflowCard({ opportunityId, initialMockup }: Props) {
    const [mockup, setMockup] = useState<Mockup | null>(initialMockup);
    const [isPending, startTransition] = useTransition();

    const createMockup = async () => {
        startTransition(async () => {
            const response = await fetch(`/api/opportunities/${opportunityId}/mockups`, { method: 'POST' });
            const data = await response.json();
            setMockup(data);
        });
    };

    const updateMockup = async (formData: FormData) => {
        if (!mockup) return;

        const status = formData.get('status') as string;
        const notes = formData.get('notes') as string;

        startTransition(async () => {
            const response = await fetch(`/api/opportunities/${opportunityId}/mockups/${mockup.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes }),
            });
            const data = await response.json();
            setMockup(data);
        });
    };

    if (!mockup) {
        return (
            <Card>
                <CardHeader><CardTitle>Mockup</CardTitle></CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4 text-gray-500">No mockup has been requested for this opportunity.</p>
                    <Button onClick={createMockup} disabled={isPending}>{isPending ? 'Requesting...' : 'Request Mockup'}</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>Mockup Workflow</CardTitle></CardHeader>
            <CardContent>
                <form action={updateMockup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Select name="status" defaultValue={mockup.status}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <Textarea name="notes" defaultValue={mockup.notes || ''} />
                    </div>
                    <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Mockup'}</Button>
                </form>
            </CardContent>
        </Card>
    );
}
