# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Liga administrators** (superadmin/editor): manage tournaments, teams, players, matches, results, news, and sanctions. Need a simple panel, no technical skills required.
- **Visitors** (players, fans, family): check fixtures, results, standings, team rosters, and league news. Mobile-first, want quick answers.

## Product Purpose

A web platform for an amateur futsal league to publish institutional information, manage tournaments and results, and give visibility to teams and players — with a simple admin panel that requires no technical knowledge for daily use.

## Positioning

The official digital home for the league. Unlike generic sports platforms, this is tailored specifically for Argentine amateur futsal: simple, mobile-first, no ads, zero configuration for team delegates.

## Operating Context

- Admin users work from desktop and mobile, often after hours (part-time league management)
- Visitors access mostly from mobile (WhatsApp shares, Instagram stories)
- Content is updated weekly (match results, news)
- No real-time updates needed for MVP
- Spanish language for all UI content

## Capabilities and Constraints

- **Confirmed**: Public pages (home, teams, matches, news, institutional), Admin panel (auth, CRUD tournaments/teams/players/matches, standings, round-robin fixtures, sanctions, news editor)
- **Tech stack**: Next.js 16, Supabase (Auth + PostgreSQL + Storage), Tailwind v4 + shadcn/ui, Vercel
- **No test runner** yet
- **Supabase free tier**: 500MB DB, 2GB storage, 50K MAU
- **Auth**: Email/password with Supabase Auth. Roles: superadmin, editor

## Brand Commitments

- **Name**: "Liga Metropolitana de Futsal" (or league-specific name)
- **Language**: Spanish for all UI text and content
- **Tone**: Warm, direct, professional — a serious league run by people who care about the sport
- **Design**: Sports-themed, clean, easy to understand. NOT generic AI/"startup" design
- **Must feel** like a real sports league site, not a SaaS product

## Evidence on Hand

- Full technical spec in `readme.md`
- Mock data for teams, players, matches, news
- DESIGN.md with initial design tokens (to be updated for sports theme)
- ~20 admin pages implemented with Server Actions + Supabase integration

## Product Principles

1. **Content-first**: The schedule, results, and standings are the product. Everything else serves them.
2. **Mobile-native**: More than half of visitors come from phones. Every page must work at 320px.
3. **Administrator sovereignty**: An admin with no technical background must be able to run the league day-to-day.
4. **Ship small, ship often**: Each iteration must be independently deployable and useful.
