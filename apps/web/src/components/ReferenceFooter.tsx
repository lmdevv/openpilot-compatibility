import {
  RiArticleLine,
  RiBookOpenLine,
  RiExternalLinkLine,
  RiGitRepositoryLine,
  RiGithubLine,
  RiShieldCheckLine,
  RiTwitterLine,
} from "@remixicon/react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { buttonVariants } from "@workspace/ui/components/button"

const referenceLinks = [
  {
    label: "comma.ai website",
    href: "https://comma.ai/vehicles",
    icon: RiBookOpenLine,
    subtitle: "Official comma ai vehicle page",
  },
  {
    label: "CARS.md",
    href: "https://github.com/commaai/openpilot/blob/master/docs/CARS.md",
    icon: RiArticleLine,
    subtitle: "Comma ai official GitHub source with detailed support info",
  },
  {
    label: "comma.ai github",
    href: "https://github.com/commaai/website/",
    icon: RiGitRepositoryLine,
    subtitle: "Comma ai website source code",
  },
  {
    label: "openpilot wiki",
    href: "https://github.com/commaai/openpilot/wiki",
    icon: RiShieldCheckLine,
    subtitle: "Community maintained compatibility notes",
  },
]

const notableLinks = [
  {
    label: "Blog",
    href: "https://blog.comma.ai",
    subtitle: "Official comma ai blog",
  },
  {
    label: "Twitter",
    href: "https://x.com/comma_ai",
    subtitle: "@comma_ai",
  },
  {
    label: "Discord",
    href: "https://discord.comma.ai",
    subtitle: "Community support chat",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@commaai",
    subtitle: "Official comma ai videos",
  },
  {
    label: "GitHub",
    href: "https://github.com/commaai",
    subtitle: "comma ai repositories",
  },
]

export function ReferenceFooter() {
  return (
    <section className="container mx-auto px-4 pt-4 pb-8 md:pb-12">
      <Card>
        <CardHeader>
          <CardTitle>References & community</CardTitle>
          <CardDescription>
            We aggregate compatibility data from comma.ai sources and community
            reports, then keep it easy to search and verify.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-2">
            {referenceLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-none border border-border bg-background px-3 py-3 text-sm transition-colors hover:bg-muted"
              >
                <link.icon />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{link.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {link.subtitle}
                  </span>
                </span>
                <RiExternalLinkLine />
              </a>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-sm font-medium">Official sites and channels</p>
            <p className="text-sm text-muted-foreground">
              These links point to the official comma.ai sources and community
              channels if you want to ask questions or verify details directly.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {notableLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-none border border-border bg-background px-3 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{link.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {link.subtitle}
                  </span>
                </span>
                <RiExternalLinkLine />
              </a>
            ))}
          </div>
          <Separator />

          <div className="space-y-1">
            <p className="text-sm font-medium">Important disclaimer</p>
            <p className="text-sm text-muted-foreground">
              This is a community-maintained project created to improve the
              openpilot compatibility search experience. It is not affiliated
              with comma.ai or openpilot in any way.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://github.com/lmdevv/openpilot-compatibility"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <RiGithubLine data-icon="inline-start" />
              GitHub
              <RiExternalLinkLine data-icon="inline-end" />
            </a>
            <a
              href="https://github.com/lmdevv/openpilot-compatibility/issues/new"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <RiShieldCheckLine data-icon="inline-start" />
              Report an issue
              <RiExternalLinkLine data-icon="inline-end" />
            </a>
            <a
              href="https://x.com/lmdev"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <RiTwitterLine data-icon="inline-start" />
              @lmdev
              <RiExternalLinkLine data-icon="inline-end" />
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
