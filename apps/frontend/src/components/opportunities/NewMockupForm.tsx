
'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { createMockupRequest } from './actions';

const initialState = { message: '', errors: {} };

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return <FormActions isSubmitting={pending} submitLabel="Request Mockup" disabled={disabled} />;
}

export function NewMockupForm({ opportunityId, opportunityName, readOnly = false }: { opportunityId: number, opportunityName: string, readOnly?: boolean }) {
    const [state, dispatch] = useFormState(createMockupRequest, initialState);

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Mockup Request</CardTitle>
                <p className="text-sm text-muted-foreground">For: {opportunityName}</p>
            </CardHeader>
            <CardContent>
                <form action={dispatch} className="space-y-6">
                    <input type="hidden" name="opportunityId" value={opportunityId} />
                    
                    <FormField label="Jersey Numbers (comma-separated)" error={state.errors?.jerseyNumbers?.[0]}>
                        <Input name="jerseyNumbers" placeholder="e.g., 1, 10, 15, 23" />
                    </FormField>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Team Colors</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Primary" error={state.errors?.primaryColor?.[0]}>
                                <Input name="primaryColor" type="color" className="h-12" defaultValue="#ffffff" />
                            </FormField>
                            <FormField label="Secondary" error={state.errors?.secondaryColor?.[0]}>
                                <Input name="secondaryColor" type="color" className="h-12" defaultValue="#000000" />
                            </FormField>
                            <FormField label="Tertiary" error={state.errors?.tertiaryColor?.[0]}>
                                <Input name="tertiaryColor" type="color" className="h-12" defaultValue="#808080"/>
                            </FormField>
                        </div>
                    </div>

                    <FormField label="Team Logo" description="Upload a high-resolution logo file." error={state.errors?.logoUrl?.[0]}>
                        <Input name="logoFile" type="file" />
                    </FormField>

                    <FormField label="Notes" description="Any additional details for the design team.">
                        <Textarea name="notes" placeholder="e.g., Please use the alternate logo, style similar to the New York Yankees pinstripes..." />
                    </FormField>

                    <SubmitButton disabled={readOnly} />
                </form>
            </CardContent>
        </Card>
    );
}
