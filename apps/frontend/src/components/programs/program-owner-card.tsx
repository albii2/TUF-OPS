"use client";

import { useState, useTransition } from "react";
import { DetailSection } from "@/components/detail/detail-section";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { OwnerSelect } from "@/components/shared/owner-select";
import { Button } from "@/components/ui/button";
import { updateProgramOwner } from "@/app/(app)/organizations/actions";

export function ProgramOwnerCard({ program, users }: { program: any, users: any[] }) {
    const [ownerId, setOwnerId] = useState(program.ownerId);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updateProgramOwner({ id: program.id, ownerId });
        });
    };

    return (
        <DetailSection title="Ownership">
            <div className="space-y-4">
                <OwnerSelect options={users} value={ownerId} onChange={setOwnerId} />
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Saving..." : "Update Owner"}
                </Button>
            </div>
        </DetailSection>
    );
}
