'use client'

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Opportunity, User } from "@prisma/client";

import { useSession } from "next-auth/react";
import { updateOpportunityOwner } from "@/lib/opportunities/mutations";
import { DetailSection } from "@/components/detail/detail-section";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OpportunityOwnerCardProps {
  opportunity: Opportunity & { owner: User | null };
  users: User[];
}

export function OpportunityOwnerCard({ opportunity, users }: OpportunityOwnerCardProps) {
  const { data: session } = useSession();
  const [ownerId, setOwnerId] = useState<number | null>(opportunity.ownerId);
  const [isPending, startTransition] = useTransition();

  const userRole = session?.user?.role;
  const isRep = userRole === 'rep';

  const getAssignableUsers = () => {
    if (userRole === 'admin') {
      return users;
    }
    if (userRole === 'director') {
        // A real implementation would fetch subordinates, but for now, we filter from the passed users.
        // This assumes the initial `users` prop contains all possible users.
      
        return users.filter(u => u.managerId === session?.user?.id || u.id === session?.user?.id);
    }
    return [];
  }

  const assignableUsers = getAssignableUsers();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateOpportunityOwner({ id: opportunity.id, ownerId });
        toast.success("Opportunity owner updated.");
      } catch (error) {
        toast.error((error as Error).message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <DetailSection title="Ownership">
      <div className="space-y-4">
        <OwnerBadge ownerName={opportunity.owner?.name} />
        {!isRep && (
            <div className="space-y-2">
                <Select onValueChange={(value) => setOwnerId(Number(value))} defaultValue={String(ownerId)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Assign an owner..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null">Unassigned</SelectItem>
                        {assignableUsers.map(user => (
                            <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={isPending} className="w-full">
                {isPending ? "Saving..." : "Update Owner"}
                </Button>
            </div>
        )}
      </div>
    </DetailSection>
  );
}
