import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import type { LaneStatus, OpportunityStage, RevenueLane } from '../data/mockSalesData';
export declare function Card({ title, children, className }: {
    title?: string;
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function Button({ children, className, type, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): import("react").JSX.Element;
export declare function Input(props: InputHTMLAttributes<HTMLInputElement>): import("react").JSX.Element;
export declare function Select(props: SelectHTMLAttributes<HTMLSelectElement>): import("react").JSX.Element;
export type Column<T> = {
    key: string;
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
};
export declare function DataTable<T>({ columns, rows, onRowClick, getRowId }: {
    columns: Column<T>[];
    rows: T[];
    onRowClick?: (row: T) => void;
    getRowId: (row: T) => string;
}): import("react").JSX.Element;
export declare function Pagination({ page, totalPages, onPageChange }: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}): import("react").JSX.Element;
export declare function LaneBadge({ lane, lanes }: {
    lane?: RevenueLane;
    lanes?: RevenueLane[];
}): import("react").JSX.Element;
export declare function StageBadge({ stage }: {
    stage: OpportunityStage;
}): import("react").JSX.Element;
export declare function LaneStatusBadge({ status }: {
    status: LaneStatus;
}): import("react").JSX.Element;
export declare function EmptyState({ title, description }: {
    title: string;
    description: string;
}): import("react").JSX.Element;
export declare function LoadingState(): import("react").JSX.Element;
export declare function SmallKpi({ label, value, note }: {
    label: string;
    value: string;
    note: string;
}): import("react").JSX.Element;
//# sourceMappingURL=primitives.d.ts.map