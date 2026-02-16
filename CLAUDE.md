# VoiceFly - Claude Code Instructions

## Project Overview
VoiceFly is a Next.js web application focused on voice AI and automation features.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Headless UI, Heroicons
- **Email:** SendGrid, React Email
- **Monitoring:** Sentry
- **Database:** Supabase

## Project Structure
```
voicefly/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities and helpers
├── public/           # Static assets
├── webhook-server.js # Webhook handling
└── revfly-server.js  # RevFly integration server
```

## Common Commands
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run revfly:dev    # Start with RevFly server
```

## Key Files
- `app/page.tsx` - Main landing page
- `app/api/` - API routes
- `.env.local` - Environment variables (never commit)

## Development Notes
<!-- Add notes here as you work on the project -->

## Gotchas & Lessons Learned
<!-- Add gotchas here when you encounter them -->

## When Working on This Project
1. Always run `npm run dev` to start the dev server
2. Check `.env.local` for required API keys
3. Use Supabase MCP for database queries when available
4. Test webhook integrations locally before deploying
