import { SchedulerSnapshot } from './types';
import { clientDB, roomDB, staffDB } from './db';

export const schedulerSnapshot: SchedulerSnapshot = {
  personas: [
    {
      id: 'scheduler',
      label: 'Scheduler',
      description: 'Fill calendars, resolve cancels, keep caregivers informed.',
      metrics: [
        { label: 'Utilization', value: '82%', trend: '+4 pts vs last wk' },
        { label: 'Same-day cancels', value: '6', trend: '-2 today' }
      ],
      focus: ['Conflicts & overlaps', 'Waitlist auto-fill', 'Travel buffers']
    },
    {
      id: 'clinical-director',
      label: 'Clinical Director',
      description: 'Ensure prescriptions met & supervision blocks scheduled.',
      metrics: [
        { label: 'Prescribed hrs met', value: '74%', trend: '+3 pts' },
        { label: 'Supervision coverage', value: '92%', trend: '+1 pt' }
      ],
      focus: ['Goals vs delivered hours', 'Supervision pairings', 'Escalations']
    },
    {
      id: 'owner',
      label: 'Practice Owner',
      description: 'Watch revenue pipeline & compliance blockers.',
      metrics: [
        { label: 'Projected revenue', value: '$128k', trend: '+$9k' },
        { label: 'EVV exceptions', value: '12', trend: '+2 today' }
      ],
      focus: ['EVV compliance', 'Payer mix', 'Location capacity']
    }
  ],
  appointments: [
    {
      id: 'APT-100245',
      title: 'Direct ABA - Mason T.',
      location: 'Austin North Center · Pod B',
      modality: 'Center',
      serviceCode: '97153',
      status: 'Pending Validation',
      scheduledStart: '2024-04-08T09:00:00-05:00',
      scheduledEnd: '2024-04-08T11:00:00-05:00',
      evvRequired: false,
      participants: [
        { id: 'CLI-9081', type: 'Client', name: clientDB['CLI-9081'].name, role: 'Primary Client' },
        { id: 'STF-112', type: 'Staff', name: staffDB['STF-112'].name, role: 'Delivering Clinician' },
        { id: 'STF-031', type: 'Staff', name: staffDB['STF-031'].name, role: 'Supervisor' }
      ],
      validations: [
        { id: 'auth', label: 'Authorization', description: 'Remaining 245 min', status: 'warning' },
        { id: 'doc', label: 'Session note', description: 'Draft saved, awaiting BCBA sign-off', status: 'warning' }
      ],
      notes: 'BCBA overlap for toileting generalization. Caregiver wants daily summary.'
    },
    {
      id: 'APT-100246',
      title: 'Home ABA - Nova H.',
      location: 'In-home · North Loop',
      modality: 'Home',
      serviceCode: '97155',
      status: 'Scheduled',
      scheduledStart: '2024-04-08T12:30:00-05:00',
      scheduledEnd: '2024-04-08T14:00:00-05:00',
      evvRequired: true,
      participants: [
        { id: 'CLI-087', type: 'Client', name: clientDB['CLI-087'].name, role: 'Primary Client' },
        { id: 'STF-210', type: 'Staff', name: staffDB['STF-210'].name, role: 'Delivering Clinician' },
        { id: 'STF-099', type: 'Staff', name: staffDB['STF-099'].name, role: 'Supervisor' }
      ],
      validations: [
        { id: 'evv', label: 'EVV device', description: 'Caregiver PIN pending', status: 'fail' }
      ],
      notes: 'Travel buffer 25 min. BCBA to model transitions for bus drop-off.'
    },
    {
      id: 'APT-100247',
      title: 'Telehealth Parent Coaching - Harper L.',
      location: 'Virtual · CST',
      modality: 'Telehealth',
      serviceCode: '97156',
      status: 'Scheduled',
      scheduledStart: '2024-04-08T18:00:00-05:00',
      scheduledEnd: '2024-04-08T19:00:00-05:00',
      evvRequired: false,
      participants: [
        { id: 'CLI-1190', type: 'Client', name: clientDB['CLI-1190'].name, role: 'Primary Client' },
        { id: 'CG-001', type: 'Caregiver', name: 'Maria Lyons', role: 'Parent' },
        { id: 'STF-041', type: 'Staff', name: staffDB['STF-041'].name, role: 'Coach' }
      ],
      validations: [
        { id: 'signature', label: 'Caregiver e-signature', description: 'Request scheduled post-session', status: 'pass' }
      ]
    }
  ],
  waitlist: [
    {
      id: 'WL-1042',
      client: clientDB['CLI-2002'].name,
      age: 5,
      diagnosis: 'Level 2 ASD',
      location: 'Austin - North Center',
      preferredWindows: 'Mon/Wed 9-12',
      requestedService: '97153 center',
      staffPreferences: 'Prefers Emilie (BCBA) + any RBT',
      notes: 'Currently receiving 4/10 prescribed hrs elsewhere.',
      priority: 'High'
    },
    {
      id: 'WL-1050',
      client: clientDB['CLI-2001'].name,
      age: 7,
      diagnosis: 'ASD w/ PDA',
      location: 'Telehealth - CST',
      preferredWindows: 'Tu/Th 6-7p',
      requestedService: '97156 telehealth',
      staffPreferences: 'Needs BCBA, Spanish speaking',
      notes: 'Caregiver portal approved to self-confirm.',
      priority: 'Medium'
    },
    {
      id: 'WL-1055',
      client: 'Atlas Pierce',
      age: 9,
      diagnosis: 'ASD + ADHD',
      location: 'Jefferson Elementary',
      preferredWindows: 'School hours 10-1',
      requestedService: 'TEAM-IEP school support',
      staffPreferences: 'BCBA-D required for IEP review',
      notes: 'District contract pending final signature.',
      priority: 'Low'
    }
  ],
  availability: [
    {
      staffId: 'STF-112',
      staffName: 'Jules Bernal, RBT',
      credential: 'RBT',
      location: 'Austin - North Center',
      load: 28,
      target: 32,
      travelBuffer: '15 min',
      evvRequired: false
    },
    {
      staffId: 'STF-210',
      staffName: 'Sasha Kim, RBT',
      credential: 'RBT',
      location: 'In-home (North Loop)',
      load: 20,
      target: 30,
      travelBuffer: '25 min',
      evvRequired: true
    },
    {
      staffId: 'STF-031',
      staffName: 'Dr. Priya Mehta, BCBA',
      credential: 'BCBA',
      location: 'Multi-site',
      load: 18,
      target: 24,
      travelBuffer: 'N/A',
      evvRequired: false
    }
  ],
  notifications: [
    {
      id: 'NTF-01',
      time: '08:15 AM',
      channel: 'SMS',
      summary: 'Caregiver confirmed Mason T. 3pm session',
      detail: 'Text confirmation captured via portal OTP.'
    },
    {
      id: 'NTF-02',
      time: '08:40 AM',
      channel: 'Email',
      summary: 'BCBA supervision block flagged for Zoe B.',
      detail: 'Needs BCBA coverage for Thu 1pm telehealth.'
    },
    {
      id: 'NTF-03',
      time: '09:05 AM',
      channel: 'Portal',
      summary: 'Harper L. requested schedule change',
      detail: 'Family needs to swap Tue PM to Thu PM this week.'
    }
  ],
  authorizations: {
    'CLI-9081': {
      clientId: 'CLI-9081',
      clientName: 'Mason Tillery',
      payer: 'Beacon Health',
      authorizedMinutes: 720,
      usedMinutes: 475,
      remainingMinutes: 245,
      expiresOn: '2024-06-30',
      serviceCodes: ['97153', '97155']
    },
    'CLI-087': {
      clientId: 'CLI-087',
      clientName: 'Nova Hernandez',
      payer: 'United Healthcare',
      authorizedMinutes: 900,
      usedMinutes: 410,
      remainingMinutes: 490,
      expiresOn: '2024-07-15',
      serviceCodes: ['97155']
    },
    'CLI-1190': {
      clientId: 'CLI-1190',
      clientName: 'Harper Lyons',
      payer: 'Aetna Better Health',
      authorizedMinutes: 480,
      usedMinutes: 300,
      remainingMinutes: 180,
      expiresOn: '2024-05-28',
      serviceCodes: ['97156']
    }
  },
  clients: Object.values(clientDB),
  staff: Object.values(staffDB),
  rooms: Object.values(roomDB)
};
