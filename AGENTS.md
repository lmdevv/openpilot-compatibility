- Always run `pnpm run check` before finishing
- Always run `pnpm run typecheck` before finishing
- This is monorepo with turborepo project

It has 2 main apps:

- `apps/web` - the main app
- `apps/commai-website` - comma ai official website

What we are building is a small simple website that main core focus is to show vehicles compatibility with openpilot. Comma ai official website already does that, but there is no great way to search and filter and see all the functionality in an easily digestable way. Our website will focus on doing that part. In a static table that will be easily searchable and filterable and the url params will also change and everything is static and instant.

Use your skills as you may see fit, ALWAYS use shadcn components, try to keep styling minimal since the shadcn components already come styled, but to follow react best practices and best frontend design UI/UX lets build something like that

Limit your use of `useState` and `useEffect` to the minimum. Priorize extremely simple and fast code UI/UX, everything has to be instant and responsive. Simple code
