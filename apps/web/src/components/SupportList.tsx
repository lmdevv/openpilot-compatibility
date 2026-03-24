import { Badge } from "@workspace/ui/components/badge"
import type { DetailNode } from "@/lib/vehicles"

interface SupportListProps {
  nodes: Array<DetailNode>
  badges: Array<{
    id: string
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }>
}

export function SupportList({ nodes, badges }: SupportListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed break-words">
        {nodes.map((node, index) => {
          if (node.type === "text") {
            return <span key={index}>{node.content}</span>
          }

          if (node.type === "strong") {
            return (
              <strong key={index} className="font-semibold text-foreground">
                {node.content}
              </strong>
            )
          }

          if (node.type === "link") {
            return (
              <a
                key={index}
                href={node.href}
                target="_blank"
                rel="noreferrer"
                className="highlight"
              >
                {node.content}
              </a>
            )
          }

          return null
        })}
      </p>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <Badge
              key={badge.id}
              variant={badge.variant}
              className="text-xs font-medium whitespace-nowrap"
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
