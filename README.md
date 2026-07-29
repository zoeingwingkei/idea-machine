# The Idea Machine

A slot-machine idea generator: pull the lever and it mashes up a space in
human life, a product form, and a twist into a random project idea — meant
to spark inspiration, not hand you a validated idea.

**Use it at [the-idea-machine.com](https://www.the-idea-machine.com/).** You
don't need to run this code to use the app — the live site is the intended
way to play with it.

## Contributing

This repo is open for contributions:

- **Found a bug, or have an idea for a feature?** Open an issue.
- **Want to expand the idea pool?** The generator draws from 3 "maps" —
  plain JSON files under [`src/data/maps/`](src/data/maps/):
  - `map-of-human-life.json` — spaces in human life (health, money, career...)
  - `map-of-product-forms.json` — product forms (app, automation, dev tool...)
  - `map-of-twists.json` — twists that make an idea feel fresh
  
  Adding a new domain, category, or twist to one of these files is one of the
  easiest ways to contribute — no code changes required. PRs welcome.

### Running locally

Only needed if you want to submit code changes. This is a Vite + React +
Tailwind CSS v4 app. Requires Node 18, 20, or 22+ (Vite 6 doesn't support
odd-numbered Node releases like 19 or 21).

```sh
npm install
npm run dev
```

Then open the printed local URL (e.g. http://localhost:5173).

To produce a production build: `npm run build` (output goes to `dist/`).

## License

[MIT](LICENSE)
