import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <section className="bg-background py-8 pb-20">
      <div className="mx-auto w-[85%] max-w-[90rem]">
        <h1>
          Is your car compatible with{" "}
          <span className="highlight">openpilot</span>?
        </h1>
        <h4 className="text-muted-foreground">
          openpilot works on 325+ car models from 27 brands. Check if yours is
          supported.
        </h4>
        <div className="mt-8 flex gap-4">
          <Button className="bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-comma-green-hover">
            Check compatibility
          </Button>
          <Button
            variant="outline"
            className="border-border px-6 py-3 text-base font-medium"
          >
            Learn more
          </Button>
        </div>
      </div>
    </section>
  )
}
