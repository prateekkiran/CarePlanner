# Continuum Scheduler OS

A bleeding-edge scheduling control tower for ABA practices, rebuilt from the updated BRD. The experience is persona-driven (Scheduler, Clinical Director, Owner) and showcases week boards, exception queues, waitlist intelligence, staff availability, and real-time notifications—all inside a single Next.js 14 workspace.

## Stack

- **Next.js 14 (App Router)** with the new React Compiler for optimal UI responsiveness.
- **TypeScript + Tailwind v4** for strongly typed data + utility-first design.
- **Mock orchestration data** under `src/lib/mockData.ts` for personas, appointments, waitlist, availability, notifications, and authorizations.

## Running locally

```bash
npm install
npm run dev  # http://localhost:3000
```

Additional scripts:

- `npm run build` – production build + typecheck
- `npm run lint` – ESLint

## Project structure

```
src/
  app/
    layout.tsx        # global layout + fonts
    page.tsx          # renders ControlTower
  components/
    ControlTower.tsx  # persona-driven workspace shell
    ClientsWorkspace.tsx
    SchedulerBoard.tsx / AppointmentDetailPanel.tsx / ScheduleComposer.tsx
    WaitlistPanel.tsx / AvailabilityPanel.tsx / ActionCenter.tsx / ExceptionQueue.tsx
  lib/
    types.ts          # domain models
    mockData.ts       # mocked BRD-aligned snapshot
    date.ts           # scheduling utilities
```

## BRD alignment highlights

- **Persona switcher + command bar** mirrors the updated BRD emphasis on role-based workflows and filters (location, modality, EVV).
- **Scheduler canvas** supports week navigation, EVV cues, and quick-add slots feeding the composer overlay.
- **Clients workspace** (via sidebar) shows prescribed vs delivered hours, staffing assignments, and status cues.
- **Exception queue + authorization insights** expose validation blockers (auth, EVV, documentation) before billing.
- **Waitlist / availability / action center** operationalize the waitlist automation, staffing load, and caregiver messaging requirements.

## Next steps

1. Replace mock data with API integrations (authorizations, availability, notifications).
2. Add drag-to-resize + travel buffer conflict detection on the scheduler grid.
3. Wire composer actions to persistence + automation (autofill waitlist, caregiver confirmations).
