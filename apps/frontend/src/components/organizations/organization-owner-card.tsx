"use client";

import { useState, useTransition } from "react";
import { DetailSection } from "@/components/detail/detail-section";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { OwnerSelect } from "@/components/shared/owner-select";
import { Button } from "@/components/ui/button";
import { updateOrganizationOwner } from "@/lib/organizations/mutations";

export function OrganizationOwnerCard({ organization, users }: { organization: any, users: any[] }) {
    const [ownerId, setOwnerId] = useState(organization.ownerId);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updateOrganizationOwner({ id: organization.id, ownerId });
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
