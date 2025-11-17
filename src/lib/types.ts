export type PersonaView = {
  id: string;
  label: string;
  description: string;
  metrics: { label: string; value: string; trend?: string }[];
  focus: string[];
};

export type Participant = {
  id: string;
  type: 'Client' | 'Staff' | 'Caregiver';
  name: string;
  role: string;
};

export type Validation = {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
};

export type Appointment = {
  id: string;
  title: string;
  location: string;
  modality: 'Center' | 'Home' | 'School' | 'Telehealth';
  serviceCode: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Validation' | 'Cancelled';
  scheduledStart: string;
  scheduledEnd: string;
  evvRequired: boolean;
  participants: Participant[];
  validations: Validation[];
  notes?: string;
};

export type WaitlistEntry = {
  id: string;
  client: string;
  age: number;
  diagnosis: string;
  location: string;
  preferredWindows: string;
  requestedService: string;
  staffPreferences: string;
  notes: string;
  priority: 'High' | 'Medium' | 'Low';
};

export type AvailabilityItem = {
  staffId: string;
  staffName: string;
  credential: string;
  location: string;
  load: number;
  target: number;
  travelBuffer: string;
  evvRequired: boolean;
};

export type NotificationItem = {
  id: string;
  time: string;
  channel: 'SMS' | 'Email' | 'Portal';
  summary: string;
  detail: string;
};

export type AuthorizationSummary = {
  clientId: string;
  clientName: string;
  payer: string;
  authorizedMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  expiresOn: string;
  serviceCodes: string[];
};

export type SchedulerSnapshot = {
  personas: PersonaView[];
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  availability: AvailabilityItem[];
  notifications: NotificationItem[];
  authorizations: Record<string, AuthorizationSummary>;
  clients: ClientRecord[];
  staff: StaffProfile[];
  rooms: RoomResource[];
};

export type ClientRecord = {
  id: string;
  name: string;
  age: number;
  location: string;
  modalityMix: string;
  hoursPrescribed: number;
  hoursDelivered: number;
  bcba: string;
  rbt: string;
  status: 'Active' | 'Waitlist' | 'Paused';
};

export type StaffProfile = {
  id: string;
  name: string;
  credential: string;
  primaryLocation: string;
};

export type RoomResource = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type: 'Therapy' | 'Group' | 'Telehealth' | 'Admin';
  bookedHours: number;
  availableHours: number;
};
