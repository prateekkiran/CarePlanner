# Continuum Scheduler

A focused front-end prototype that brings the BRD to life with a unified appointment console. It highlights multi-participant appointments, EVV + validation workflows, and actionable insights for schedulers, clinicians, and billing admins.

## Getting Started

```bash
npm install
npm run dev   # start local dev server on http://localhost:5173
npm run build # type-check + build for production
npm run preview
```

## Architecture & BRD Alignment

- **React + Vite + TypeScript** foundation with modular components under `src/components`.
- **Persona-driven control tower**: `PersonaSwitcher`, `CommandBar`, and the new `workspace-grid` replicate the BRD-Updated requirement for role-based workflows (Scheduler, Clinical Director, Owner).
- **Scheduler canvas** (`Scheduler.tsx`) remains the heartbeat, but now sits alongside:
  - `ExceptionQueue` for validations/EVV/auth blockers.
  - `AppointmentDetail` with inline authorization rollup.
  - `WaitlistPanel`, `AvailabilityPanel`, and `ActionCenter` for waitlist intelligence, staffing load, and caregiver/staff notifications.
- **Mock orchestration data** lives in `public/mock/backend/*.json` (appointments, authorizations) plus the richer context in `src/data/mockScheduler.ts`.
- **Styling** centralised in `src/styles/global.css` with new utility classes for persona cards, command bar, workspace layout, waitlist cards, etc.

## Interaction Highlights

- Persona toggle instantly reframes KPIs/focus areas.
- Command bar introduces location/modality/EVV filters (ready for deeper wiring).
- Weekly schedule grid still supports click-to-create + reschedule with multi-select participants and auto-auth callouts.
- Exception queue surfaces validation failures in line with compliance requirements.
- Waitlist/availability/notifications panels support the triage-focused workflows described in the updated BRD.

## Next Ideas

1. Wire persona switch + filters to actual API queries (GraphQL or REST).
2. Power the waitlist “Suggest matches” CTA with heuristics or ML ranking.
3. Add drag-to-resize/drag-to-move plus travel-buffer warnings on the scheduler grid.
