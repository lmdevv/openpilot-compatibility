import {
  Outlet,
  HeadContent,
  Scripts,
  ScriptOnce,
  createRootRoute,
} from "@tanstack/react-router"
import { HotkeysProvider } from "@tanstack/react-hotkeys"

import appCss from "@workspace/ui/globals.css?url"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"

const themeScript = `
  (function() {
    try {
      const theme = window.localStorage.getItem('openpilot-theme') || 'system'
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.add('light')
      }
    } catch (e) {}
  })()
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "openpilot vehicle compatibility",
      },
      {
        name: "description",
        content: "Check if your car is compatible with openpilot",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.png",
        type: "image/png",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  return (
    <HotkeysProvider>
      <ThemeProvider defaultTheme="system" storageKey="openpilot-theme">
        <div className="flex min-h-svh flex-col">
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
        </div>
      </ThemeProvider>
    </HotkeysProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ScriptOnce children={themeScript} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
