# Omni v2 — Changes since docs freeze 2026-03-26

**Base tag:** v2.260326.1
**HEAD:** 391857c8 (on dev; latest published v2.260405.2)
**Commits:** 97
**Files:** 182 changed (+38,945 / -4,999)

## Major new features

### 1. `feat/instance-scoping` — major merge (PR #349)
Instance-scoping across Omni. Large architectural change landing multimodal providers.

### 2. Multimodal provider framework (Wave 2, Groups 8-12)
- New `media` verbs: `speak`, `listen`, `imagine`, `see`, `film`
- New `react` verb with `resolveReplyTo` context helper
- Provider framework for multimodal capabilities
- `context` methods in CLI + SDK coverage test

### 3. `channel-gupshup` — NEW channel plugin
- Full Gupshup channel: REST API client, webhook handler, senders, identity
- Plugin class + CLI + SDK integration
- zod webhook validation
- `gupshup` added to `channelTypes` enum
- API/DB schema fields for Gupshup credentials

### 4. Persons / dedup overhaul
- Cross-instance person matching by `platformUserId`
- Merge/link/unlink/update CLI + SDK commands
- Smarter `@lid` auto-linking
- Person dedup migration script
- Guard sync-worker against storing LID numbers as phone numbers

### 5. Execution
- Turn-based execution mode wired into agent dispatcher (new API feature)

### 6. Fixes landed
- `/health` root redirect for external checkers (#335)
- Exponential retry for NATS reply subscription (#345)
- Removed over-broad JID self-filter dropping owner phone messages (#344)
- WhatsApp reaction echo dispatch loop (#336)
- vCard `waid` parameter for clickable contacts (#330)
- `genie dir ls` replaces non-existent `genie dir get` in connect (#338)
- NatsGenieProvider `onReply` callback wiring (#340)

## Documentation impact

| Area | Action needed |
|------|--------------|
| Instance scoping concept | NEW section — architectural |
| `omni send --react` (media verbs) | NEW commands: speak/listen/imagine/see/film |
| `channel-gupshup` | NEW provider page + setup guide |
| `persons` CLI: merge/link/unlink/update | NEW subcommands |
| Person dedup concept | NEW architectural page |
| Turn-based execution mode | NEW execution mode docs |
| Provider framework | Update concepts/providers |
