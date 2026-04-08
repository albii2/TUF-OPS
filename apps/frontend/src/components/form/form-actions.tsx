import { Button } from '@/components/ui/button'

export function FormActions({
  isPending,
  isSubmitting,
  submitLabel = 'Save Changes',
  disabled = false,
}: {
  isPending?: boolean
  isSubmitting?: boolean
  submitLabel?: string
  disabled?: boolean
}) {
  const pending = isPending ?? isSubmitting ?? false

  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending || disabled}>
        {pending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}
