import { ClientRecord, StaffProfile } from './types';
import type { RoomResource } from './types';

export const staffDB: Record<string, StaffProfile> = {
  'STF-112': { id: 'STF-112', name: 'Jules Bernal, RBT', credential: 'RBT', primaryLocation: 'Austin - North Center' },
  'STF-031': { id: 'STF-031', name: 'Dr. Priya Mehta, BCBA', credential: 'BCBA', primaryLocation: 'Multi-site' },
  'STF-210': { id: 'STF-210', name: 'Sasha Kim, RBT', credential: 'RBT', primaryLocation: 'North Loop In-home' },
  'STF-099': { id: 'STF-099', name: 'Dr. Mateo Ruiz, BCBA', credential: 'BCBA', primaryLocation: 'In-home' },
  'STF-041': { id: 'STF-041', name: 'Jordan Patel, BCBA', credential: 'BCBA', primaryLocation: 'Telehealth' },
  'STF-134': { id: 'STF-134', name: 'Nina Patel, BCBA', credential: 'BCBA', primaryLocation: 'School Services' }
};

export const clientDB: Record<string, ClientRecord> = {
  'CLI-9081': {
    id: 'CLI-9081',
    name: 'Mason Tillery',
    age: 6,
    location: 'Austin - North Center',
    modalityMix: 'Center (80%) · Home (20%)',
    hoursPrescribed: 20,
    hoursDelivered: 16,
    bcba: staffDB['STF-031'].name,
    rbt: staffDB['STF-112'].name,
    status: 'Active'
  },
  'CLI-087': {
    id: 'CLI-087',
    name: 'Nova Hernandez',
    age: 5,
    location: 'North Loop In-home',
    modalityMix: 'Home (100%)',
    hoursPrescribed: 15,
    hoursDelivered: 12,
    bcba: staffDB['STF-099'].name,
    rbt: staffDB['STF-210'].name,
    status: 'Active'
  },
  'CLI-1190': {
    id: 'CLI-1190',
    name: 'Harper Lyons',
    age: 7,
    location: 'Telehealth · CST',
    modalityMix: 'Telehealth caregiver coaching',
    hoursPrescribed: 8,
    hoursDelivered: 6,
    bcba: staffDB['STF-041'].name,
    rbt: '—',
    status: 'Active'
  },
  'CLI-1055': {
    id: 'CLI-1055',
    name: 'Atlas Pierce',
    age: 9,
    location: 'Jefferson Elementary',
    modalityMix: 'School consult',
    hoursPrescribed: 6,
    hoursDelivered: 2,
    bcba: staffDB['STF-134'].name,
    rbt: '—',
    status: 'Waitlist'
  },
  'CLI-2001': {
    id: 'CLI-2001',
    name: 'Harper Benny',
    age: 7,
    location: 'Telehealth - CST',
    modalityMix: 'Telehealth caregiver coaching',
    hoursPrescribed: 10,
    hoursDelivered: 0,
    bcba: 'TBD',
    rbt: '—',
    status: 'Waitlist'
  },
  'CLI-2002': {
    id: 'CLI-2002',
    name: 'Noah Patel',
    age: 5,
    location: 'Austin - North Center',
    modalityMix: 'Center-based',
    hoursPrescribed: 12,
    hoursDelivered: 0,
    bcba: staffDB['STF-031'].name,
    rbt: staffDB['STF-112'].name,
    status: 'Waitlist'
  }
};

export const roomDB: Record<string, RoomResource> = {
  'RM-101': {
    id: 'RM-101',
    name: 'Pod B · Sensory',
    location: 'Austin - North Center',
    capacity: 3,
    type: 'Therapy',
    bookedHours: 32,
    availableHours: 40
  },
  'RM-201': {
    id: 'RM-201',
    name: 'Telehealth Suite A',
    location: 'Virtual · CST',
    capacity: 1,
    type: 'Telehealth',
    bookedHours: 18,
    availableHours: 30
  },
  'RM-301': {
    id: 'RM-301',
    name: 'Group Room 1',
    location: 'Austin - North Center',
    capacity: 8,
    type: 'Group',
    bookedHours: 22,
    availableHours: 35
  },
  'RM-401': {
    id: 'RM-401',
    name: 'School Resource Slot',
    location: 'Jefferson Elementary',
    capacity: 4,
    type: 'Therapy',
    bookedHours: 10,
    availableHours: 25
  }
};
