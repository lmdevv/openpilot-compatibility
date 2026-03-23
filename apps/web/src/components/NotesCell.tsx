import type { VehicleRow } from "@/lib/vehicles"

interface NotesCellProps {
  row: VehicleRow
}

export function NotesCell({ row }: NotesCellProps) {
  const notes = [...row.footnotes, ...row.setupNotes]

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {row.video && (
          <a
            href={row.video}
            target="_blank"
            rel="noreferrer"
            className="highlight text-xs"
          >
            Drive video
          </a>
        )}
        {row.setupVideo && (
          <a
            href={row.setupVideo}
            target="_blank"
            rel="noreferrer"
            className="highlight text-xs"
          >
            Setup video
          </a>
        )}
      </div>

      {notes.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {notes.map((note) => (
            <li key={note} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          No additional notes
        </p>
      )}
    </div>
  )
}
