# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-18

Initial release of the Insight Study Companion — a mastery-driven theological
study app built with Expo, SQLite, Drizzle, Zustand, and SM-2 spaced repetition.

### Features

- **Study sessions** — browse topics by category, start study sessions, and
  track progress per topic (Topic Registry, Topic Detail, and Study screens).
- **Spaced repetition review** — flashcard review screen backed by an SM-2
  scheduler and a SQLite due queue, with mastery updates and difficulty
  indicators.
- **Dashboard** — home screen showing due counts and study activity, with
  navigation into topics and review.
- **Progress tracking** — stats dashboard wired to real database data,
  including a weekly progress chart.
- **Settings** — light/dark theme toggle, plus JSON export/import and reset of
  study data.
- **Mobile-friendly web chat UI** — a companion web interface for the Bible
  study agent.
- **Local-first data** — SQLite schema and Drizzle ORM client with a Zustand
  session store and JW URL validation.

### Fixes

- Serve the web UI from the root `index.html` so the Vercel deployment renders
  correctly.
- Resolve compile blockers by adding `ThemeContext` and `ProgressChart` and
  wrapping the app root in `ThemeProvider`.
- Bootstrap review rows from existing study entries so the due count stays
  accurate for already-studied topics.

[1.0.0]: https://github.com/marketclick360-ux/insight-study-companion-v2/releases/tag/v1.0.0
