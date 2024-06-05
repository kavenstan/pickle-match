# Pickt

## Install

```bash
pnpm -i
```

## Run

```bash
pnpm run dev
```

## Build

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.

## TODO

- UI
  - Login
  - Tables
- UX
  - Matchmaking wizard
  - Creating manual matches
  - Setting scores
- Features
  - ELO calculation configuration
    - Higher K for newer players
    - Initial rating values for known players
    - Clustering ratings for grades Gold/Silver/Bronze?
  - User
    - Roles/Permissions
    - User management
    - Server auth check
    - Client auth check
  - Graph rating change over time per player
  - Save rating changes per match
  - Caching
    - Limit direct reads to firestore
- Bugs
  - Player ids/names used interchangably
