import Link from 'next/link';
import { Organization } from '@prisma/client';
import { DetailSection } from '@/components/detail/detail-section';

export function OrganizationSummaryCard({ organization }: { organization: Organization }) {
    return (
        <DetailSection title="Program">
            <Link href={`/organizations/${organization.id}`} className="font-semibold text-blue-600 hover:underline">
                {organization.name}
            </Link>
            {/* Future location data can be added here */}
        </DetailSection>
    );
}
