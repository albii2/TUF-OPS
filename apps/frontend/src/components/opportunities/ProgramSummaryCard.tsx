import Link from 'next/link';
import { Program } from '@prisma/client';
import { DetailSection } from '@/components/detail/detail-section';

export function ProgramSummaryCard({ program }: { program: Program }) {
    return (
        <DetailSection title="Program">
            <Link href={`/programs/${program.id}`} className="font-semibold text-blue-600 hover:underline">
                {program.name}
            </Link>
            {/* Future location data can be added here */}
        </DetailSection>
    );
}
