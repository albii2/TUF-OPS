'use client'
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { MockupRequestStatus } from '@prisma/client';
import { toast } from 'sonner';
import { updateMockupRequestStatus } from '@/app/(app)/orders/_actions/updateMockupRequestStatus';

interface MockupStatusActionsProps {
  mockupRequestId: string;
  currentStatus: MockupRequestStatus;
}

export function MockupStatusActions({ mockupRequestId, currentStatus }: MockupStatusActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (status: MockupRequestStatus) => {
    startTransition(async () => {
      try {
        await updateMockupRequestStatus({ mockupRequestId, status });
        toast.success(`Mockup status updated to ${status}`);
      } catch (error) {
        toast.error('Failed to update mockup status.');
      }
    });
  };

  return (
    <div className="flex gap-2 mt-2">
      {currentStatus === 'Requested' && (
        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('InProgress')} disabled={isPending}>
          Start Progress
        </Button>
      )}
      {currentStatus === 'InProgress' && (
        <>
          <Button size="sm" variant="success" onClick={() => handleStatusUpdate('Approved')} disabled={isPending}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={isPending}>
            Reject
          </Button>
        </>
      )}
    </div>
  );
}
