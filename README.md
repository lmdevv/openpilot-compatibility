# TODO

## Add hotkey support

use tanstack hotkeys, for typesafe hotkey support. I want this site to be extremely fast and easy to use UX/UI so we can do something like r to reset the filters, or `s` to search vehicles or `m` to filter through makes from dropdown `s` for sorting from dropdown.

## Add other points of getting information

So for now we are basically improving the UI in a better table for the current official website, but there is also different places that there is more detailed information about compatibility, or even community maintained compatibility support.

Some of the websites that I also want to index and get information to have them all gathered in one place:

- Community support: https://wiki.comma.ai/
- CARS.md: https://github.com/commaai/openpilot/blob/master/docs/CARS.md

So what I want to do is have my main website gather and index all of this different sources

## WXT extension

We create new extension that will be very simple, with simple command or highlighting something the extension will identify the vehicle that the user is looking at any website, then it will check openpilot compatibility, and it will do so by querying our main website and checking if there is any real support, or community support or anything like that

## Improve filters

Improve filtering and sorting, where it could be all of for example something like `May struggle in tight turns` or !`May struggle in tight turns` but in a nice UI

## Make shadcn button styling to match openpilot

We can remove the need for <a className="highlight"> and instead use shadcn button and have specific variant with that styling.

## Fix search input not accepting spaces
