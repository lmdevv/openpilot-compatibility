# shadcn/ui monorepo template

This is a TanStack Start monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

# TODO

## Add hotkey support

use tanstack hotkeys, for typesafe hotkey support. I want this site to be extremely fast and easy to use UX/UI so we can do something like r to reset the filters, or `s` to search vehicles or `m` to filter through makes from dropdown `s` for sorting from dropdown.

## Remove harness dropdown from filtering

Lets remove the dropdown for harness, there is no need for that

## Improve support column content

So as of now how it is working is we have a normalizer ./apps/web/src/lib/vehicles.ts but it is looking a bit bad, I want that the support column will simple get the vehicles.json["detail_sentence"] and thats it, even we can have the strong thing so it looks nice, then we can have normalizer get some important params from the detailed sentence and then show them as badges (which can be filterable). So a couple of examples:

openpilot upgrades your <strong>Volkswagen Tiguan eHybrid</strong> with automated lane centering <strong>at all speeds</strong>, and adaptive cruise control <strong>that automatically resumes from a stop</strong>.

Then normalizer will get the following important things:

- Automated lane centering **at all speeds**
- Adaptice Cruise control that resumes from stop

openpilot upgrades your <strong>Acura ILX</strong> with automated lane centering and adaptive cruise control <strong>while driving above 26 mph</strong>. This car may not be able to take tight turns on its own. Traffic light and stop sign handling is also available in <a href='https://blog.comma.ai/090release/#experimental-mode' target='_blank' class='highlight'>Experimental mode</a>

Then badges for

- ALC above 26 mph
- ACC above 26 mph
- Struggle in tight turns on its own
- Traffic light and stop sign handling is available in experimental mode

or something like that, so we can have this badges and then filter them based on the badges, but for exmample we do not have to have different filters for ALC above 26 mph or ALC above 19 we can have like a slider or input box where we can have as default all of them, but if not something like we can filter through specific mileage or stuff like that or filter out the ones that are not at all speeds or stuff like that. And this badges are going to be simple and easy to understand.

## Add buy button to official comma ai shop

## Add reference and community check to the official github page

Add a footnote where we can have references of all

## Add other points of getting information

So for now we are basically improving the UI in a better table for the current official website, but there is also different places that there is more detailed information about compatibility, or even community maintained compatibility support.

Some of the websites that I also want to index and get information to have them all gathered in one place:

- Community support: https://wiki.comma.ai/
- CARS.md: https://github.com/commaai/openpilot/blob/master/docs/CARS.md

So what I want to do is have my main website gather and index all of this different sources

## Deploy to vercel

## WXT extension

We create new extension that will be very simple, with simple command or highlighting something the extension will identify the vehicle that the user is looking at any website, then it will check openpilot compatibility, and it will do so by querying our main website and checking if there is any real support, or community support or anything like that
