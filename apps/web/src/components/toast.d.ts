import { type ReactNode } from 'react';
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useToast(): {
    success: (message: string) => void;
    error: (message: string, onRetry?: () => void) => void;
};
//# sourceMappingURL=toast.d.ts.map