'use client'

import { useEffect, useState } from 'react';
import { OpportunityEvent } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare, Repeat, ArrowRight, User, Calendar } from 'lucide-react';

interface TimelineEvent extends OpportunityEvent {
    actorUser: {
        name: string | null;
    }
}

function formatEventDetails(event: TimelineEvent) {
    switch (event.eventType) {
        case 'stage_change':
            return <div className="flex items-center">Stage changed from <Badge variant="secondary" className="mx-2">{event.fromStage}</Badge> <ArrowRight className="w-4 h-4 mr-2" /> <Badge variant="default">{event.toStage}</Badge></div>;
        case 'owner_change':
            const newOwner = (event.metadata as any)?.newOwnerName || 'Unassigned';
            return `Owner changed to ${newOwner}`;
        case 'next_step_change':
            return `Next step updated to: "${(event.metadata as any)?.new}"`
        case 'due_date_change':
            const newDate = (event.metadata as any)?.new;
            return `Next step due date changed to ${newDate ? format(new Date(newDate), 'PPP') : 'none'}`;
        default:
            return `An unknown event occurred.`;
    }
}

function getEventIcon(eventType: string) {
    switch (eventType) {
        case 'stage_change': return <Repeat className="w-5 h-5 text-blue-500" />;
        case 'owner_change': return <User className="w-5 h-5 text-gray-500" />;
        case 'next_step_change': return <MessageSquare className="w-5 h-5 text-green-500" />;
        case 'due_date_change': return <Calendar className="w-5 h-5 text-orange-500" />;
        default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
}

export function ActivityTimeline({ opportunityId }: { opportunityId: number }) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/opportunities/${opportunityId}/events`);
                if (!response.ok) {
                    throw new Error('Failed to fetch activity timeline.');
                }
                const data = await response.json();
                setEvents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchEvents();
    }, [opportunityId]);

    if (isLoading) {
        return <div className="p-4 text-center">Loading activity...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        No activity recorded yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 pt-1">{getEventIcon(event.eventType)}</div>
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{formatEventDetails(event)}</p>
                                    <p className="text-xs text-gray-500">
                                        by {event.actorUser.name || 'System'} • {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
