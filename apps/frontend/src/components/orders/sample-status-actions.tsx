'use client'
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { SampleRequestStatus } from '@prisma/client';
import { toast } from 'sonner';
import { updateSampleRequestStatus } from '@/app/(app)/orders/_actions/updateSampleRequestStatus';

interface SampleStatusActionsProps {
  sampleRequestId: string;
  currentStatus: SampleRequestStatus;
}

export function SampleStatusActions({ sampleRequestId, currentStatus }: SampleStatusActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (status: SampleRequestStatus) => {
    startTransition(async () => {
      try {
        await updateSampleRequestStatus({ sampleRequestId, status });
        toast.success(`Sample status updated to ${status}`);
      } catch (error) {
        toast.error('Failed to update sample status.');
      }
    });
  };

  return (
    <div className="flex gap-2 mt-2">
        {currentStatus === 'Requested' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('Ordered')} disabled={isPending}>
                Mark as Ordered
            </Button>
        )}
        {currentStatus === 'Ordered' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('Shipped')} disabled={isPending}>
                Mark as Shipped
            </Button>
        )}
        {currentStatus === 'Shipped' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('Delivered')} disabled={isPending}>
                Mark as Delivered
            </Button>
        )}
        {currentStatus === 'Delivered' && (
            <Button size="sm" variant="success" onClick={() => handleStatusUpdate('Completed')} disabled={isPending}>
                Complete
            </Button>
        )}
    </div>
  );
}
