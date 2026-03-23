import { Button } from "@workspace/ui/components/button"

interface EmptyStateProps {
  onReset: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <p className="text-sm text-muted-foreground">No vehicles found</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
        Clear filters
      </Button>
    </div>
  )
}
