import { Button } from '@/components/ui/button'

export function FormActions({
  isPending,
  isSubmitting,
  submitLabel = 'Save Changes',
}: {
  isPending?: boolean
  isSubmitting?: boolean
  submitLabel?: string
}) {
  const pending = isPending ?? isSubmitting ?? false

  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}
