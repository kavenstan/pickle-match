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
  - Easier score entry 
   - Move to second score selection after first
   - Move to next match after match
  - Easier match creation
   - Once last player selected - button to add another match / next round / set scores
- Features
  - Matchmaking
   - On create - group information 
     - Amount of combinations of players
     - Amount of valid combinations with current rating limit
     - Suggest rate limit / repeat combinations?
   - Balanced 
    - if no pairing found, offer options to increase ranges or allow repeat partnerships
    - if allowing repeat, don't choose recent partnerships
  - Player
   - Match History
  - Add a configurable timer to start the round?
  - ELO calculation configuration
    - Higher K for newer players ?
  - Arch
   - Server side pages
   - Caching
   - User
    - Roles/Permissions
    - User management
    - Server auth check
    - Client auth check
- Bugs
 - Stats / Ratings not calculated on session end
 - Should be some provisional rating calculation between rounds
 - Matchmaking page 3 empty
 - Starting matchmaking does nothing - need to refresh to see