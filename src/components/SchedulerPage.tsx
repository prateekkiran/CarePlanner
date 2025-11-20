'use client';

import { useMemo, useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import type { ReactNode } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  ListItemText,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Fade
} from '@mui/material';
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  InfoOutlined,
  CheckCircleRounded,
  NoteAlt,
  Bolt,
  FmdGood,
  ViewComfyAlt,
  ViewCompactAlt,
  ContentCopy
} from '@mui/icons-material';
import { addDays, addMinutes, differenceInMinutes, format, startOfWeek } from 'date-fns';
import Draggable from 'react-draggable';
import { schedulerSnapshot } from '@/lib/mockData';
import type { Appointment, AvailabilityItem, ClientRecord, Participant, Validation } from '@/lib/types';
import { ScheduleComposer } from './ScheduleComposer';

const VIEW_SCOPES = ['Scheduler view', 'My schedule', 'Client schedule'] as const;
const VIEW_MODES = ['Day', '3-day', 'Week'] as const;
const CARE_SETTINGS: Array<'Center' | 'Home' | 'School' | 'Telehealth'> = ['Center', 'Home', 'School', 'Telehealth'];
const FLAG_OPTIONS = ['Show EVV required', 'Auth at risk', 'Waitlist ready', 'Show my staff'];
const HOURS = Array.from({ length: 12 }, (_, index) => 7 + index);
const CARE_SETTING_ICONS: Record<SessionCard['modality'], string> = {
  Center: '🏥',
  Home: '🏠',
  School: '🏫',
  Telehealth: '💻'
};

type SessionCard = {
  id: string;
  laneId?: string;
  clientId?: string;
  start: Date;
  end: Date;
  title: string;
  client: string;
  modality: 'Center' | 'Home' | 'School' | 'Telehealth';
  serviceCode: string;
  status: Appointment['status'];
  evvRequired: boolean;
  location: string;
  validations?: Validation[];
  notes?: string;
  participants: Participant[];
  durationMinutes: number;
  hasSupervisor: boolean;
};

type SchedulePrefill = {
  clientId?: string;
  staffId?: string;
  serviceCode?: string;
  modality?: SessionCard['modality'];
  start?: Date;
  durationMinutes?: number;
};

export function SchedulerPage() {
  const [scope, setScope] = useState<(typeof VIEW_SCOPES)[number]>('Scheduler view');
  const [viewMode, setViewMode] = useState<(typeof VIEW_MODES)[number]>('Week');
  const [weekAnchor, setWeekAnchor] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [location, setLocation] = useState('All campuses');
  const [careFilters, setCareFilters] = useState<Array<'Center' | 'Home' | 'School' | 'Telehealth'>>(CARE_SETTINGS);
  const [flags, setFlags] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [composerOpen, setComposerOpen] = useState(false);
  const [laneWidths, setLaneWidths] = useState<Record<string, number>>({});
  const laneObserverMap = useRef<Record<string, ResizeObserver>>({});
  const [dragPositions, setDragPositions] = useState<Record<string, number>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBatchSessions, setSelectedBatchSessions] = useState<string[]>([]);
  const [batchDialog, setBatchDialog] = useState<{ type: 'cancel' | 'move' | 'reassign' | null }>({ type: null });
  const [toast, setToast] = useState<string>('');
  const [activeHighlight, setActiveHighlight] = useState<'makeup' | 'underutilized' | 'waitlist' | null>(null);
  const [densityMode, setDensityMode] = useState<'comfortable' | 'compact'>('comfortable');
  const [composerPrefill, setComposerPrefill] = useState<SchedulePrefill | null>(null);
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [sessions, setSessions] = useState<SessionCard[]>(() =>
    schedulerSnapshot.appointments.map((appointment) => {
      const staffParticipant = appointment.participants.find((participant) => participant.type === 'Staff');
      const clientParticipant = appointment.participants.find((participant) => participant.type === 'Client');
      const durationMinutes = differenceInMinutes(new Date(appointment.scheduledEnd), new Date(appointment.scheduledStart));
      const hasSupervisor = appointment.participants.filter((participant) => participant.type === 'Staff').length > 1;
      return {
        id: appointment.id,
        laneId: staffParticipant?.id,
        clientId: clientParticipant?.id,
        start: new Date(appointment.scheduledStart),
        end: new Date(appointment.scheduledEnd),
        title: appointment.title,
        client: clientParticipant?.name ?? 'Client',
        modality: appointment.modality,
        serviceCode: appointment.serviceCode,
        status: appointment.status,
        evvRequired: appointment.evvRequired,
        location: appointment.location,
        validations: appointment.validations,
        notes: appointment.notes,
        participants: appointment.participants,
        durationMinutes,
        hasSupervisor
      };
    })
  );
  const clientMap = useMemo(() => {
    const map: Record<string, ClientRecord> = {};
    schedulerSnapshot.clients.forEach((client) => {
      map[client.id] = client;
    });
    return map;
  }, []);
  const authorizations = schedulerSnapshot.authorizations;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const horizonDays = viewMode === 'Day' ? 1 : viewMode === '3-day' ? 3 : 7;
  const staffLanes = schedulerSnapshot.availability;
  const filteredLanes = useMemo(() => {
    let lanes: AvailabilityItem[] = staffLanes;
    if (location !== 'All campuses') {
      lanes = lanes.filter((lane) => lane.location.includes(location.split(' - ')[0] ?? location));
    }
    if (selectedStaff.length) {
      lanes = lanes.filter((lane) => selectedStaff.includes(lane.staffId));
    } else {
      return [];
    }
    return lanes;
  }, [staffLanes, location, selectedStaff]);

  const visibleSessions = useMemo(() => {
    return sessions.filter((session) => {
      const inRange = session.start >= weekAnchor && session.start < addDays(weekAnchor, horizonDays);
      const careMatch = careFilters.includes(session.modality);
      const staffMatch = selectedStaff.length === 0 ? false : session.laneId ? selectedStaff.includes(session.laneId) : false;
      const clientMatch = selectedClients.length === 0 ? true : session.clientId ? selectedClients.includes(session.clientId) : false;
      return inRange && careMatch && staffMatch && clientMatch;
    });
  }, [sessions, weekAnchor, horizonDays, careFilters, selectedStaff, selectedClients]);

  const selectedSession = visibleSessions.find((session) => session.id === selectedSessionId);

  function handleWeekChange(delta: number) {
    setWeekAnchor((prev) => addDays(prev, delta * horizonDays));
  }

  function toggleCare(setting: (typeof CARE_SETTINGS)[number]) {
    setCareFilters((prev) => (prev.includes(setting) ? prev.filter((item) => item !== setting) : [...prev, setting]));
  }

  function toggleFlag(flag: string) {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((item) => item !== flag) : [...prev, flag]));
  }

  function handleComposerCreate(appointment: Appointment) {
    schedulerSnapshot.appointments.push(appointment);
    const staffParticipant = appointment.participants.find((participant) => participant.type === 'Staff');
    const clientParticipant = appointment.participants.find((participant) => participant.type === 'Client');
    const durationMinutes = differenceInMinutes(new Date(appointment.scheduledEnd), new Date(appointment.scheduledStart));
    setSessions((prev) => [
      ...prev,
      {
        id: appointment.id,
        laneId: staffParticipant?.id,
        clientId: clientParticipant?.id,
        start: new Date(appointment.scheduledStart),
        end: new Date(appointment.scheduledEnd),
        title: appointment.title,
        client: clientParticipant?.name ?? 'Client',
        modality: appointment.modality,
        serviceCode: appointment.serviceCode,
        status: appointment.status,
        evvRequired: appointment.evvRequired,
        location: appointment.location,
        validations: appointment.validations,
        notes: appointment.notes,
        participants: appointment.participants,
        durationMinutes,
        hasSupervisor: appointment.participants.filter((participant) => participant.type === 'Staff').length > 1
      }
    ]);
    setSelectedSessionId(appointment.id);
  }

  function openComposerWithPrefill(prefill?: SchedulePrefill) {
    setComposerPrefill(prefill ?? null);
    setComposerOpen(true);
  }

  useEffect(
    () => () => {
      Object.values(laneObserverMap.current).forEach((observer) => observer.disconnect());
    },
    []
  );

  const summaryStats = [
    { label: 'Caregiver confirmations', value: '24', helper: '+5 vs yesterday', gradient: 'linear-gradient(120deg,#ede9fe,#ddd6fe)' },
    { label: 'Utilization', value: '82%', helper: 'Goal 85%', gradient: 'linear-gradient(120deg,#fce7f3,#ffe4e6)' },
    { label: 'Open slots today', value: '6', helper: '2 high priority', gradient: 'linear-gradient(120deg,#dbeafe,#bae6fd)' }
  ];

  const highlightDetails = {
    makeup: [
      { client: 'Aarav Sharma', target: 10, scheduled: 6, gap: 4, staff: 'Jordan', payer: 'Aetna' },
      { client: 'Mia Robinson', target: 8, scheduled: 4, gap: 4, staff: 'Sam', payer: 'Medicaid' }
    ],
    underutilized: [
      { window: 'Wed 2–4 PM', location: 'Center A', staff: '3 RBTs free', note: 'Prime time – lightly booked' },
      { window: 'Thu 4–6 PM', location: 'Telehealth', staff: '2 BCBAs free', note: 'Telehealth licenses idle' }
    ],
    waitlist: [
      { client: 'Kian Patel', preferred: 'Weekdays 2–5 PM', hours: 6, setting: 'Center', note: 'Can start next week' },
      { client: 'Layla Brooks', preferred: 'Wed/Fri 3–6 PM', hours: 8, setting: 'Center', note: 'Auth ready' }
    ]
  };

  const handleLaneRef = useCallback(
    (laneId: string) => (node: HTMLDivElement | null) => {
      if (laneObserverMap.current[laneId]) {
        laneObserverMap.current[laneId].disconnect();
        delete laneObserverMap.current[laneId];
      }
      if (!node) {
        return;
      }

      setLaneWidths((prev) => {
        const width = node.clientWidth;
        if (prev[laneId] === width) return prev;
        return { ...prev, [laneId]: width };
      });

      const observer = new ResizeObserver((entries) => {
        const width = entries[0].contentRect.width;
        setLaneWidths((prev) => {
          if (prev[laneId] === width) return prev;
          return { ...prev, [laneId]: width };
        });
      });
      observer.observe(node);
      laneObserverMap.current[laneId] = observer;
    },
    []
  );

  const handleSessionDragStop = useCallback(
    (session: SessionCard, laneId: string, xPosition: number, laneWidth: number) => {
      if (!laneWidth) return;
      const minutesPerDay = HOURS.length * 60;
      const totalRange = minutesPerDay * horizonDays;
      const clampedX = Math.max(0, Math.min(xPosition, laneWidth));
      const minutesFromStart = (clampedX / laneWidth) * totalRange;
      const dayIndex = Math.min(horizonDays - 1, Math.max(0, Math.floor(minutesFromStart / minutesPerDay)));
      const minuteWithinDay = minutesFromStart - dayIndex * minutesPerDay;
      const newStartBase = addDays(weekAnchor, dayIndex);
      const newStart = new Date(newStartBase);
      newStart.setHours(HOURS[0], 0, 0, 0);
      const roundedMinutes = Math.round(minuteWithinDay / 5) * 5;
      newStart.setMinutes(newStart.getMinutes() + roundedMinutes);
      const duration = differenceInMinutes(session.end, session.start);
      const newEnd = addMinutes(newStart, duration);
      setSessions((prev) => prev.map((item) => (item.id === session.id ? { ...item, start: newStart, end: newEnd, laneId } : item)));
      setDragPositions((prev) => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });
    },
    [horizonDays, weekAnchor]
  );

  return (
    <Stack spacing={3} sx={{ background: 'linear-gradient(180deg,#f4f6fb,#ffffff)' }} p={{ xs: 1, sm: 2, md: 3 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(120deg,#eef2ff,#faf5ff)' }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Schedule
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              Scheduling intelligence lab
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Material-inspired workspace for orchestration, coverage, and rapid creation.
            </Typography>
          </Box>
          <ToggleButtonGroup exclusive value={scope} onChange={(_, value) => value && setScope(value)} sx={{ ml: 'auto' }}>
            {VIEW_SCOPES.map((label) => (
              <ToggleButton key={label} value={label} size="small">
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
        <Grid container spacing={2} mt={2}>
          {summaryStats.map((stat) => (
            <Grid item xs={12} md={4} key={stat.label}>
              <Card elevation={0} sx={{ borderRadius: 4, background: stat.gradient }}>
                <CardContent>
                  <Typography variant="overline" sx={{ letterSpacing: '0.2em' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2">{stat.helper}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" mt={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => handleWeekChange(-1)}>
              <ArrowBackIosNew fontSize="inherit" />
            </IconButton>
            <Chip
              label={`Week of ${format(weekAnchor, 'MMM d, yyyy')}`}
              color="secondary"
              variant="outlined"
              sx={{ borderRadius: '999px', px: 2, fontWeight: 600, letterSpacing: 0.5 }}
            />
            <IconButton size="small" onClick={() => handleWeekChange(1)}>
              <ArrowForwardIos fontSize="inherit" />
            </IconButton>
          </Stack>
          <ToggleButtonGroup exclusive value={viewMode} onChange={(_, value) => value && setViewMode(value)}>
            {VIEW_MODES.map((mode) => (
              <ToggleButton key={mode} value={mode} size="small">
                {mode}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField
            select
            label="Location"
            SelectProps={{ native: true }}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option>All campuses</option>
            <option>Austin - North Center</option>
            <option>Telehealth · CST</option>
          </TextField>
          <Button variant="contained" onClick={() => openComposerWithPrefill()} sx={{ borderRadius: 999 }}>
            + New session
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="overline" color="text.secondary">
              Care settings
            </Typography>
            {CARE_SETTINGS.map((setting) => (
              <Chip
                key={setting}
                label={setting}
                color={careFilters.includes(setting) ? 'primary' : 'default'}
                variant={careFilters.includes(setting) ? 'filled' : 'outlined'}
                onClick={() => toggleCare(setting)}
                sx={{ borderRadius: '999px', px: 2 }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="overline" color="text.secondary">
              Flags
            </Typography>
            {FLAG_OPTIONS.map((flag) => (
              <Chip
                key={flag}
                label={flag}
                onClick={() => toggleFlag(flag)}
                color={flags.includes(flag) ? 'secondary' : 'default'}
                variant="outlined"
                sx={{ borderRadius: '999px' }}
              />
            ))}
            <ToggleButtonGroup
              size="small"
              color="primary"
              value={selectedStaff.length ? 'focus' : 'all'}
              exclusive
              onChange={(_, value) => {
                if (value === 'all') {
                  setSelectedStaff(staffLanes.map((lane) => lane.staffId));
                } else if (value === 'focus') {
                  setSelectedStaff([]);
                }
              }}
              sx={{ ml: 'auto' }}
            >
              <ToggleButton value="all">All staff</ToggleButton>
              <ToggleButton value="focus">Focus only</ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant={selectionMode ? 'contained' : 'outlined'}
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                setSelectionMode((prev) => !prev);
                setSelectedBatchSessions([]);
              }}
            >
              {selectionMode ? 'Exit select mode' : 'Select sessions'}
            </Button>
            <ToggleButtonGroup
              size="small"
              value={densityMode}
              exclusive
              onChange={(_, value) => value && setDensityMode(value)}
            >
              <ToggleButton value="comfortable">
                <ViewComfyAlt fontSize="inherit" />
              </ToggleButton>
              <ToggleButton value="compact">
                <ViewCompactAlt fontSize="inherit" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={3}>
          <SchedulerLeftRail
            staff={staffLanes}
            clients={schedulerSnapshot.clients}
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
            selectedClients={selectedClients}
            setSelectedClients={setSelectedClients}
            onHighlightSelect={(type) => setActiveHighlight(type)}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TimelineCanvas
            lanes={filteredLanes}
            sessions={visibleSessions}
            weekAnchor={weekAnchor}
            horizonDays={horizonDays}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            laneWidths={laneWidths}
            onLaneRef={handleLaneRef}
            dragPositions={dragPositions}
            setDragPositions={setDragPositions}
            onSessionDragStop={handleSessionDragStop}
            selectionMode={selectionMode}
            selectedBatchSessions={selectedBatchSessions}
            clientLookup={clientMap}
            authorizations={authorizations}
            densityMode={densityMode}
            hoveredLane={hoveredLane}
            onHoverLane={setHoveredLane}
            currentTime={currentTime}
            onBookSimilar={(session) =>
              openComposerWithPrefill({
                clientId: session.clientId,
                staffId: session.laneId,
                serviceCode: session.serviceCode,
                modality: session.modality,
                start: session.start,
                durationMinutes: session.durationMinutes
              })
            }
            onToggleBatchSession={(sessionId) => {
              setSelectedBatchSessions((prev) =>
                prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
              );
            }}
          />
        </Grid>
        <Grid item xs={12} lg={3}>
          {activeHighlight ? (
            <HighlightDetailPanel
              type={activeHighlight}
              data={highlightDetails}
              onClose={() => setActiveHighlight(null)}
              onLaunchSuggestion={(payload) => {
                setToast(`Launching suggested slots for ${payload}`);
                openComposerWithPrefill();
              }}
            />
          ) : (
            <SessionPanel
              key={selectedSession?.id ?? 'empty'}
              session={selectedSession}
              onClear={() => setSelectedSessionId(undefined)}
              clientLookup={clientMap}
              authorizations={authorizations}
              staffOptions={staffLanes}
              onBookSimilar={(session) =>
                openComposerWithPrefill({
                  clientId: session.clientId,
                  staffId: session.laneId,
                  serviceCode: session.serviceCode,
                  modality: session.modality,
                  start: session.start,
                  durationMinutes: session.durationMinutes
                })
              }
            />
          )}
        </Grid>
      </Grid>

      {selectionMode && (
        <Fade in={selectedBatchSessions.length > 0}>
          <Box
            sx={{
              position: 'sticky',
              bottom: 16,
              alignSelf: 'flex-end',
              background: 'white',
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              display: 'flex',
              gap: 2,
              alignItems: 'center'
            }}
          >
            <Typography variant="body2">{selectedBatchSessions.length} session(s) selected</Typography>
            <Button size="small" variant="text" onClick={() => setSelectedBatchSessions([])}>
              Clear
            </Button>
            <Button size="small" variant="outlined" onClick={() => setBatchDialog({ type: 'cancel' })} disabled={!selectedBatchSessions.length}>
              Cancel
            </Button>
            <Button size="small" variant="outlined" onClick={() => setBatchDialog({ type: 'move' })} disabled={!selectedBatchSessions.length}>
              Move
            </Button>
            <Button size="small" variant="contained" onClick={() => setBatchDialog({ type: 'reassign' })} disabled={!selectedBatchSessions.length}>
              Reassign
            </Button>
          </Box>
        </Fade>
      )}

      {composerOpen && (
        <ScheduleComposer
          prefill={composerPrefill ?? undefined}
          onClose={() => {
            setComposerOpen(false);
            setComposerPrefill(null);
          }}
          onCreate={handleComposerCreate}
        />
      )}
      <BatchDialog
        type={batchDialog.type}
        sessions={sessions}
        selectedSessionIds={selectedBatchSessions}
        staffOptions={staffLanes}
        onClose={() => setBatchDialog({ type: null })}
        onApply={(nextSessions, message) => {
          setSessions(nextSessions);
          setToast(message);
          setBatchDialog({ type: null });
          setSelectionMode(false);
          setSelectedBatchSessions([]);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="success" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function SchedulerLeftRail({
  staff,
  clients,
  selectedStaff,
  setSelectedStaff,
  selectedClients,
  setSelectedClients,
  onHighlightSelect
}: {
  staff: AvailabilityItem[];
  clients: typeof schedulerSnapshot.clients;
  selectedStaff: string[];
  setSelectedStaff: (ids: string[]) => void;
  selectedClients: string[];
  setSelectedClients: (ids: string[]) => void;
  onHighlightSelect: (type: 'makeup' | 'underutilized' | 'waitlist') => void;
}) {
  const staffOptions = staff.map((item) => ({
    id: item.staffId,
    label: item.staffName,
    subtitle: `${item.credential} · ${item.location}`,
    initials: item.staffName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
  }));

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: client.name,
    subtitle: `${client.status} · ${client.location}`
  }));

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
      <Stack spacing={3}>
        <TextField label="Search the lab" placeholder="Search staff, client, session" size="small" />
        <Box>
          <Typography variant="overline" color="text.secondary">
            Staff focus
          </Typography>
          <Autocomplete
            multiple
            options={staffOptions}
            getOptionLabel={(option) => option.label}
            value={staffOptions.filter((option) => selectedStaff.includes(option.id))}
            onChange={(_, newValue) => setSelectedStaff(newValue.map((option) => option.id))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const chipProps = getTagProps({ index });
                delete (chipProps as Record<string, unknown>).key;
                return <Chip key={option.id} label={option.label} size="small" {...chipProps} />;
              })
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>{option.initials}</Avatar>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Focus staff" placeholder="Type to filter staff" />}
          />
        </Box>
        <Divider />
        <Box>
          <Typography variant="overline" color="text.secondary">
            Clients
          </Typography>
          <Autocomplete
            multiple
            options={clientOptions}
            getOptionLabel={(option) => option.label}
            value={clientOptions.filter((option) => selectedClients.includes(option.id))}
            onChange={(_, newValue) => setSelectedClients(newValue.map((option) => option.id))}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const chipProps = getTagProps({ index });
                delete (chipProps as Record<string, unknown>).key;
                return <Chip key={option.id} label={option.label} size="small" color="secondary" {...chipProps} />;
              })
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <ListItemText primary={option.label} secondary={option.subtitle} />
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Focus clients" placeholder="Search client roster" />}
          />
        </Box>
        <Divider />
        <Box>
          <Typography variant="overline" color="text.secondary">
            Saved views
          </Typography>
          <Stack spacing={1} mt={1}>
            {[
              { label: 'Round Rock morning crew', staffIds: ['STF-305', 'STF-412'] },
              { label: 'Telehealth wrap-up', staffIds: ['STF-041', 'STF-702'] },
              { label: 'In-home south pods', staffIds: ['STF-509', 'STF-618'] }
            ].map((view) => (
              <Button
                key={view.label}
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedStaff(view.staffIds);
                }}
              >
                {view.label}
              </Button>
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Highlights
          </Typography>
          <Stack spacing={1} mt={1}>
            <Button variant="text" size="small" onClick={() => onHighlightSelect('makeup')}>
              ⚡ 3 clients need make-up hours this week
            </Button>
            <Button variant="text" size="small" onClick={() => onHighlightSelect('underutilized')}>
              ⚠ Underutilized windows tomorrow
            </Button>
            <Button variant="text" size="small" onClick={() => onHighlightSelect('waitlist')}>
              ⚡ Waitlist: 2 matches for Wed afternoon
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function TimelineCanvas({
  lanes,
  sessions,
  weekAnchor,
  horizonDays,
  selectedSessionId,
  onSelectSession,
  laneWidths,
  onLaneRef,
  dragPositions,
  setDragPositions,
  onSessionDragStop,
  selectionMode,
  selectedBatchSessions,
  onToggleBatchSession,
  clientLookup,
  authorizations,
  densityMode,
  hoveredLane,
  onHoverLane,
  currentTime,
  onBookSimilar
}: {
  lanes: AvailabilityItem[];
  sessions: SessionCard[];
  weekAnchor: Date;
  horizonDays: number;
  selectedSessionId?: string;
  onSelectSession: (id: string) => void;
  laneWidths: Record<string, number>;
  onLaneRef: (laneId: string) => (node: HTMLDivElement | null) => void;
  dragPositions: Record<string, number>;
  setDragPositions: Dispatch<SetStateAction<Record<string, number>>>;
  onSessionDragStop: (session: SessionCard, laneId: string, x: number, laneWidth: number) => void;
  selectionMode: boolean;
  selectedBatchSessions: string[];
  onToggleBatchSession: (sessionId: string) => void;
  clientLookup: Record<string, ClientRecord>;
  authorizations: typeof schedulerSnapshot.authorizations;
  densityMode: 'comfortable' | 'compact';
  hoveredLane: string | null;
  onHoverLane: (laneId: string | null) => void;
  currentTime: Date;
  onBookSimilar: (session: SessionCard) => void;
}) {
  const totalMinutes = HOURS.length * 60;
  const isCompact = densityMode === 'compact';
  const laneHeight = isCompact ? 140 : 210;

  const nowFraction = useMemo(() => {
    const windowEnd = addDays(weekAnchor, horizonDays);
    if (currentTime < weekAnchor || currentTime >= windowEnd) return null;
    const dayIndex = Math.floor((currentTime.getTime() - weekAnchor.getTime()) / (1000 * 60 * 60 * 24));
    const minuteOffset = (currentTime.getHours() - HOURS[0]) * 60 + currentTime.getMinutes();
    if (minuteOffset < 0 || minuteOffset > totalMinutes) return null;
    return (dayIndex * totalMinutes + minuteOffset) / (totalMinutes * horizonDays);
  }, [currentTime, horizonDays, totalMinutes, weekAnchor]);

  function getPosition(session: SessionCard) {
    const dayIndex = Math.floor((session.start.getTime() - weekAnchor.getTime()) / (1000 * 60 * 60 * 24));
    const startMinutes = (session.start.getHours() - HOURS[0]) * 60 + session.start.getMinutes();
    const fraction = (dayIndex * totalMinutes + startMinutes) / (totalMinutes * horizonDays);
    const widthFraction = differenceInMinutes(session.end, session.start) / (totalMinutes * horizonDays);
    return { leftFraction: fraction, widthFraction: Math.max(widthFraction, 0.02) };
  }

  if (!lanes.length) {
    return (
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1" fontWeight={600} gutterBottom>
          Select staff to populate the scheduler
        </Typography>
        <Typography variant="body2">
          Use the multi-select on the left to choose one or more team members. Their timeline lanes will appear here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4 }}>
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        {Array.from({ length: horizonDays }).map((_, index) => (
          <Typography key={index} variant="subtitle2" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
            {format(addDays(weekAnchor, index), 'EEE d')}
          </Typography>
        ))}
      </Stack>
      <Stack spacing={3}>
        {lanes.map((lane) => {
          const laneWidth = laneWidths[lane.staffId];
          const utilization = lane.load / lane.target;
          const isFocused = hoveredLane === lane.staffId;
          return (
            <Box
              key={lane.staffId}
              onMouseEnter={() => onHoverLane(lane.staffId)}
              onMouseLeave={() => onHoverLane(null)}
              sx={{
                border: '1px solid',
                borderColor: 'grey.100',
                borderRadius: 3,
                p: 2,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                transform: hoveredLane ? (isFocused ? 'scale(1.01)' : 'scale(0.98)') : 'scale(1)',
                opacity: hoveredLane && !isFocused ? 0.6 : 1,
                boxShadow: isFocused ? 4 : 0,
                background: isFocused ? 'linear-gradient(180deg,#ffffff,#f8fafc)' : '#fff'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                <Stack spacing={0.25}>
                  <Typography fontWeight={600}>{lane.staffName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lane.credential} · {lane.location}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, utilization * 100)}
                  sx={{ flexGrow: 1, borderRadius: 999, height: 8, bgcolor: 'grey.100' }}
                />
                <Chip label={`${lane.load}/${lane.target} hrs`} size="small" color={utilization > 0.9 ? 'error' : 'success'} />
              </Stack>
              <Box
                ref={onLaneRef(lane.staffId)}
                sx={{
                  position: 'relative',
                  border: '1px dashed',
                  borderColor: 'rgba(148,163,184,0.4)',
                  borderRadius: 3,
                  height: laneHeight,
                  overflow: 'hidden',
                  backgroundImage:
                    'linear-gradient(180deg, rgba(59,130,246,0.08) 0 40%, rgba(16,185,129,0.08) 40% 75%, rgba(249,115,22,0.08) 75% 100%)'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 24px, rgba(15,23,42,0.05) 24px 25px)',
                    pointerEvents: 'none'
                  }}
                />
                {nowFraction !== null && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${nowFraction * 100}%`,
                      width: '2px',
                      background: 'rgba(79,70,229,0.9)',
                      boxShadow: '0 0 12px rgba(79,70,229,0.6)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
                {(() => {
                  const laneSessions = sessions
                    .filter((session) => session.laneId === lane.staffId)
                    .sort((a, b) => a.start.getTime() - b.start.getTime());
                  const startGroups: Record<string, string[]> = {};
                  laneSessions.forEach((session) => {
                    const key = session.start.toISOString();
                    if (!startGroups[key]) startGroups[key] = [];
                    startGroups[key].push(session.id);
                  });
                  const stackLookup: Record<string, { index: number; count: number }> = {};
                  Object.values(startGroups).forEach((ids) =>
                    ids.forEach((id, index) => {
                      stackLookup[id] = { index, count: ids.length };
                    })
                  );
                  return laneSessions.map((session) => {
                    const { leftFraction, widthFraction } = getPosition(session);
                    const leftPx = laneWidth ? laneWidth * leftFraction : 0;
                    const widthPx = laneWidth ? laneWidth * widthFraction : 0;
                    const currentX = dragPositions[session.id] ?? leftPx;
                    const isSelected = selectedBatchSessions.includes(session.id);
                    const clientRecord = session.clientId ? clientLookup[session.clientId] : undefined;
                    const authMeta = getAuthMeta(session, authorizations);
                    const riskFlags = getRiskFlags(session);
                    const palette = getServicePalette(session.serviceCode);
                    const band = getBandInfo(session.start);
                    const stackMeta = stackLookup[session.id];
                    const tooltipContent = (
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2">{session.client}</Typography>
                        {clientRecord && (
                          <Typography variant="caption" color="text.secondary">
                            {clientRecord.age}y · {clientRecord.location}
                          </Typography>
                        )}
                        <Typography variant="body2" mt={0.5}>
                          {session.serviceCode} · {differenceInMinutes(session.end, session.start)} min
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.modality} · {session.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Auth: {authMeta.helper}
                        </Typography>
                      </Box>
                    );

                    return (
                      <TimelineSessionCard
                        key={session.id}
                        session={session}
                        laneId={lane.staffId}
                        laneWidth={laneWidth}
                        laneHeight={laneHeight}
                        leftFraction={leftFraction}
                        widthFraction={widthFraction}
                        widthPx={widthPx}
                        currentX={currentX}
                        palette={palette}
                        isCompact={isCompact}
                        selectionMode={selectionMode}
                        isSelected={isSelected}
                        isActive={selectedSessionId === session.id}
                        stackMeta={stackMeta}
                        band={band}
                        authMeta={authMeta}
                        riskFlags={riskFlags}
                        tooltipContent={tooltipContent}
                        onSelectSession={onSelectSession}
                        onToggleBatchSession={onToggleBatchSession}
                        onBookSimilar={onBookSimilar}
                        setDragPositions={setDragPositions}
                        onSessionDragStop={onSessionDragStop}
                      />
                    );
                  });
                })()}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function PeopleChip() {
  return (
    <Tooltip title="Supervision overlap">
      <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.65rem' } }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>BC</Avatar>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>RBT</Avatar>
      </AvatarGroup>
    </Tooltip>
  );
}

function SessionPanel({
  session,
  onClear,
  clientLookup,
  authorizations,
  staffOptions,
  onBookSimilar
}: {
  session?: SessionCard;
  onClear: () => void;
  clientLookup: Record<string, ClientRecord>;
  authorizations: typeof schedulerSnapshot.authorizations;
  staffOptions: AvailabilityItem[];
  onBookSimilar: (session: SessionCard) => void;
}) {
  if (!session) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Select a session to view details or click + New session to start a schedule.
        </Typography>
      </Paper>
    );
  }

  const client = session.clientId ? clientLookup[session.clientId] : undefined;
  const auth = session.clientId ? authorizations[session.clientId] : undefined;
  const staffDisplay = staffOptions.find((staff) => staff.staffId === session.laneId);
  const authMeta = getAuthMeta(session, authorizations);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="overline" color="text.secondary">
            {session.serviceCode}
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {session.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(session.start, 'EEE, MMM d · h:mma')} – {format(session.end, 'h:mma')} · {session.modality}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={session.status} size="small" variant="outlined" />
          <Button size="small" onClick={onClear}>
            Close
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip label={authMeta.label} color={authMeta.color} variant={authMeta.variant} size="small" />
        {session.evvRequired && <Chip label="EVV required" color="error" size="small" />}
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Session summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration {differenceInMinutes(session.end, session.start)} min
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Location {session.location}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assigned to {staffDisplay?.staffName ?? 'Unassigned'}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Participants
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 32, height: 32 }}>{client?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'CL'}</Avatar>
                <Box>
                  <Typography fontWeight={600}>{client?.name ?? session.client}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {client?.status ?? 'Active'}
                  </Typography>
                </Box>
              </Stack>
              {session.participants
                .filter((participant) => participant.type === 'Staff')
                .map((participant) => (
                  <Stack key={participant.id} direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32 }}>{participant.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{participant.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {participant.role}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Authorization
            </Typography>
            {auth ? (
              <Stack spacing={0.5}>
                <Typography fontWeight={600}>{auth.payer}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining {auth.remainingMinutes} min · Expires {format(new Date(auth.expiresOn), 'MMM d, yyyy')}
                </Typography>
                {(authMeta.severity === 'warning' || authMeta.severity === 'error') && (
                  <Alert severity={authMeta.severity === 'error' ? 'error' : 'warning'}>{authMeta.helper}</Alert>
                )}
              </Stack>
            ) : (
              <Typography variant="body2">No authorization information.</Typography>
            )}
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Operations
            </Typography>
            <Typography variant="body2">EVV: {session.evvRequired ? 'Required' : 'Not required'}</Typography>
            <Typography variant="body2">Last updated: {format(session.end, 'MMM d · h:mma')}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} mt="auto" flexWrap="wrap">
        <Button variant="contained" size="small" onClick={() => onBookSimilar(session)}>
          Book similar
        </Button>
        <Button variant="outlined" size="small">
          Reschedule
        </Button>
      </Stack>
    </Paper>
  );
}

type TimelineSessionCardProps = {
  session: SessionCard;
  laneId: string;
  laneWidth?: number;
  laneHeight: number;
  leftFraction: number;
  widthFraction: number;
  widthPx: number;
  currentX: number;
  palette: { background: string; tab: string };
  isCompact: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  isActive: boolean;
  stackMeta?: { index: number; count: number };
  band: TimeBandInfo;
  authMeta: AuthMeta;
  riskFlags: RiskFlag[];
  tooltipContent: ReactNode;
  onSelectSession: (id: string) => void;
  onToggleBatchSession: (id: string) => void;
  onBookSimilar: (session: SessionCard) => void;
  setDragPositions: Dispatch<SetStateAction<Record<string, number>>>;
  onSessionDragStop: (session: SessionCard, laneId: string, xPosition: number, laneWidth: number) => void;
};

function TimelineSessionCard({
  session,
  laneId,
  laneWidth,
  laneHeight,
  leftFraction,
  widthFraction,
  widthPx,
  currentX,
  palette,
  isCompact,
  selectionMode,
  isSelected,
  isActive,
  stackMeta,
  band,
  authMeta,
  riskFlags,
  tooltipContent,
  onSelectSession,
  onToggleBatchSession,
  onBookSimilar,
  setDragPositions,
  onSessionDragStop
}: TimelineSessionCardProps) {
  const statusStyle = getStatusStyles(session.status);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const usableHeight = Math.max(72, laneHeight - (isCompact ? 16 : 36));
  const stackOffset = stackMeta ? stackMeta.index * 6 : 0;
  const durationSegments = Math.max(1, Math.round(session.durationMinutes / 30));
  const card = (
    <Paper
      ref={nodeRef}
      elevation={0}
      sx={{
        position: 'absolute',
        top: (isCompact ? 8 : 12) + stackOffset,
        left: laneWidth ? 0 : `${leftFraction * 100}%`,
        width: laneWidth ? `${Math.max(widthPx - stackOffset, 120)}px` : `${widthFraction * 100}%`,
        minWidth: 110,
        height: `${usableHeight}px`,
        borderRadius: 3,
        border: selectionMode
          ? isSelected
            ? '2px solid #0ea5e9'
            : '1px dashed rgba(14,165,233,0.6)'
          : isActive
            ? '2px solid #6366f1'
            : statusStyle.border,
        borderStyle: statusStyle.borderStyle,
        bgcolor: band.outside ? 'rgba(248,113,113,0.12)' : palette.background,
        color: '#0f172a',
        p: 1.2,
        cursor: selectionMode ? 'pointer' : laneWidth ? 'grab' : 'pointer',
        opacity: statusStyle.opacity,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'visible',
        boxShadow: isActive ? '0 12px 24px rgba(79,70,229,0.25)' : '0 6px 14px rgba(15,23,42,0.12)',
        backgroundImage: `linear-gradient(180deg, ${palette.background}, ${band.color})`,
        zIndex: stackMeta ? 20 - stackMeta.index : 10
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (selectionMode) {
          onToggleBatchSession(session.id);
        } else {
          onSelectSession(session.id);
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -6,
          left: 16,
          right: 16,
          height: 10,
          borderRadius: '999px',
          background: palette.tab,
          boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
        }}
      />
      <Stack spacing={1} flexGrow={1} justifyContent="space-between" mt={0.5}>
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isCompact ? shortenName(session.client) : session.client}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {format(session.start, 'h:mma')} – {format(session.end, 'h:mma')} · {session.serviceCode}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.5} alignItems="center" maxWidth="70%">
            <Typography variant="caption">{CARE_SETTING_ICONS[session.modality]}</Typography>
            {!isCompact && (
              <Typography variant="caption" color="text.secondary" sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.location.split('·')[0]?.trim() ?? session.location}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {session.status === 'Completed' && <CheckCircleRounded fontSize="inherit" color="success" />}
            {session.notes && <NoteAlt fontSize="inherit" color="warning" />}
            {session.hasSupervisor && <PeopleChip />}
          </Stack>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" mt={0.5}>
        <Chip label={authMeta.label} size="small" color={authMeta.color} variant={authMeta.variant} sx={{ height: 20 }} />
        {!isCompact && <Chip label={band.label} size="small" color={band.outside ? 'error' : 'info'} variant="outlined" sx={{ height: 20 }} />}
        {session.evvRequired && (
          <Tooltip title="EVV required">
            <FmdGood fontSize="inherit" color="error" />
          </Tooltip>
        )}
        {riskFlags.map((flag) => (
          <Tooltip title={flag.label} key={flag.label}>
            <flag.icon fontSize="inherit" color={flag.color} />
          </Tooltip>
        ))}
        {!isCompact && (
          <Tooltip title="Book similar">
            <IconButton
              size="small"
              sx={{ ml: 'auto' }}
              onClick={(event) => {
                event.stopPropagation();
                onBookSimilar(session);
              }}
            >
              <ContentCopy fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Box display="grid" gridTemplateColumns={`repeat(${durationSegments}, minmax(6px, 1fr))`} gap={0.5} mt={0.75}>
        {Array.from({ length: durationSegments }).map((_, index) => (
          <Box key={index} sx={{ height: 4, borderRadius: 999, background: index % 2 === 0 ? palette.tab : 'rgba(15,23,42,0.2)' }} />
        ))}
      </Box>
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          sx={{ position: 'absolute', top: 0, right: 0 }}
          color="primary"
          onChange={() => onToggleBatchSession(session.id)}
        />
      )}
    </Paper>
  );

  const wrappedCard = (
    <Tooltip key={session.id} title={tooltipContent} placement="top" enterDelay={400} leaveDelay={100} arrow>
      {card}
    </Tooltip>
  );

  if (!laneWidth) {
    return (
      <Tooltip key={`${session.id}-disabled`} title="Select staff to enable drag & drop">
        {card}
      </Tooltip>
    );
  }

  if (selectionMode) {
    return <Box key={session.id}>{wrappedCard}</Box>;
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      key={session.id}
      axis="x"
      bounds="parent"
      position={{ x: currentX, y: 0 }}
      onDrag={(_, data) =>
        setDragPositions((prev) => ({
          ...prev,
          [session.id]: data.x
        }))
      }
      onStop={(_, data) => {
        if (!laneWidth) return;
        onSessionDragStop(session, laneId, data.x, laneWidth);
      }}
    >
      {wrappedCard}
    </Draggable>
  );
}


const SERVICE_COLOR_MAP: Record<string, { background: string; tab: string }> = {
  '97153': { background: '#eef2ff', tab: '#6366f1' },
  '97155': { background: '#fff7ed', tab: '#f97316' },
  '97156': { background: '#ecfccb', tab: '#22c55e' }
};

function getServicePalette(serviceCode: string) {
  return SERVICE_COLOR_MAP[serviceCode] ?? { background: '#f5f5f4', tab: '#0ea5e9' };
}

type TimeBandInfo = { label: string; color: string; outside: boolean };

const TIME_BANDS: { label: string; start: number; end: number; color: string }[] = [
  { label: 'Morning focus', start: 7, end: 11, color: 'rgba(59,130,246,0.15)' },
  { label: 'Core hours', start: 11, end: 17, color: 'rgba(16,185,129,0.18)' },
  { label: 'Evening flex', start: 17, end: 21, color: 'rgba(249,115,22,0.18)' }
];

function getBandInfo(date: Date): TimeBandInfo {
  const hour = date.getHours() + date.getMinutes() / 60;
  const band = TIME_BANDS.find((entry) => hour >= entry.start && hour < entry.end);
  if (!band) {
    return { label: 'Off-hours', color: 'rgba(248,113,113,0.15)', outside: true };
  }
  return { label: band.label, color: band.color, outside: false };
}

function getAuthMeta(session: SessionCard, authorizations: typeof schedulerSnapshot.authorizations): AuthMeta {
  if (!session.clientId) {
    return { label: 'No auth', color: 'error', variant: 'filled', helper: 'No client selected', severity: 'error' };
  }
  const auth = authorizations[session.clientId];
  if (!auth) {
    return { label: 'No auth', color: 'error', variant: 'filled', helper: 'No authorization on file', severity: 'error' };
  }
  const remaining = auth.remainingMinutes;
  const expiration = new Date(auth.expiresOn);
  if (session.end > expiration) {
    return {
      label: 'Auth expired',
      color: 'error',
      variant: 'filled',
      helper: `Expired ${format(expiration, 'MMM d')}`,
      severity: 'error'
    };
  }
  if (remaining <= 0) {
    return {
      label: 'No units',
      color: 'error',
      variant: 'filled',
      helper: '0 minutes remain',
      severity: 'error'
    };
  }
  if (remaining < session.durationMinutes * 2) {
    return {
      label: 'Low auth',
      color: 'warning',
      variant: 'outlined',
      helper: `${remaining} min remaining`,
      severity: 'warning'
    };
  }
  return {
    label: 'Auth OK',
    color: 'success',
    variant: 'outlined',
    helper: `${remaining} min remaining`,
    severity: 'success'
  };
}

function getRiskFlags(session: SessionCard): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const validations = session.validations ?? [];
  if (validations.some((validation) => validation.id === 'travel' && validation.status !== 'pass')) {
    flags.push({ icon: Bolt, label: 'Travel buffer risk', color: 'warning' });
  }
  if (validations.some((validation) => validation.id === 'evv' && validation.status === 'fail')) {
    flags.push({ icon: InfoOutlined, label: 'EVV exception', color: 'error' });
  }
  return flags;
}

function getStatusStyles(status: SessionCard['status']) {
  switch (status) {
    case 'Completed':
      return { border: '1px solid rgba(34,197,94,0.6)', borderStyle: 'solid', opacity: 0.9 };
    case 'Cancelled':
      return { border: '1px dashed rgba(148,163,184,0.8)', borderStyle: 'dashed', opacity: 0.5 };
    case 'Pending Validation':
      return { border: '1px solid rgba(248,113,113,0.8)', borderStyle: 'solid', opacity: 1 };
    case 'In Progress':
      return { border: '2px solid rgba(14,165,233,0.7)', borderStyle: 'solid', opacity: 1 };
    default:
      return { border: '1px solid rgba(99,102,241,0.4)', borderStyle: 'solid', opacity: 1 };
  }
}

function shortenName(value: string) {
  const parts = value.split(' ');
  if (parts.length <= 1) return value;
  return `${parts[0]} ${parts[1][0]}.`;
}


function BatchDialog({
  type,
  sessions,
  selectedSessionIds,
  staffOptions,
  onClose,
  onApply
}: {
  type: 'cancel' | 'move' | 'reassign' | null;
  sessions: SessionCard[];
  selectedSessionIds: string[];
  staffOptions: AvailabilityItem[];
  onClose: () => void;
  onApply: (nextSessions: SessionCard[], message: string) => void;
}) {
  const [reason, setReason] = useState('Staff sick');
  const [offset, setOffset] = useState(60);
  const [replacement, setReplacement] = useState<string>('');

  const selectedSessions = useMemo(
    () => sessions.filter((session) => selectedSessionIds.includes(session.id)),
    [sessions, selectedSessionIds]
  );

  const resolvedReplacement = replacement || staffOptions[0]?.staffId || '';

  const preview = useMemo(() => {
    if (!type) return null;
    return buildBatchPreview({ type, selectedSessions, allSessions: sessions, reason, offset, replacement: resolvedReplacement, staffOptions });
  }, [type, selectedSessions, sessions, reason, offset, resolvedReplacement, staffOptions]);

  if (!type) return null;

  const title =
    type === 'cancel'
      ? `Cancel ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}`
      : type === 'move'
        ? `Move ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}`
        : `Reassign ${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'}`;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {selectedSessions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Select session cards before launching a batch action.
          </Typography>
        ) : (
          <Stack spacing={3} mt={1}>
            {type === 'cancel' && (
              <Stack spacing={2}>
                <TextField select label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} SelectProps={{ native: true }}>
                  {['Staff sick', 'Client sick', 'Weather', 'Facility issue', 'Caregiver request'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextField>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Notify caregivers" />
              </Stack>
            )}
            {type === 'move' && (
              <Stack spacing={2}>
                <TextField
                  label="Shift minutes"
                  type="number"
                  value={offset}
                  onChange={(event) => setOffset(Number(event.target.value))}
                  helperText="Positive values move later, negative earlier"
                />
              </Stack>
            )}
            {type === 'reassign' && (
              <Stack spacing={2}>
                <TextField
                  select
                  label="Replacement staff"
                  value={resolvedReplacement}
                  onChange={(event) => setReplacement(event.target.value)}
                  SelectProps={{ native: true }}
                >
                  {staffOptions.map((staff) => (
                    <option key={staff.staffId} value={staff.staffId}>
                      {staff.staffName} ({staff.credential})
                    </option>
                  ))}
                </TextField>
              </Stack>
            )}
            {preview && (
              <Stack spacing={1}>
                <Alert severity={preview.successes.length ? 'info' : 'warning'}>{preview.message}</Alert>
                {preview.blocked.length > 0 && (
                  <Stack spacing={0.5}>
                    {preview.blocked.map((entry) => (
                      <Typography key={entry.sessionId} variant="caption" color="error">
                        • {entry.reason}
                      </Typography>
                    ))}
                  </Stack>
                )}
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Previewing first {Math.min(3, selectedSessions.length)} of {selectedSessions.length} selection(s).
                </Typography>
                <Stack spacing={1}>
                  {selectedSessions.slice(0, 3).map((session) => (
                    <Paper key={session.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="subtitle2">{session.client}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(session.start, 'EEE, MMM d · h:mma')} – {format(session.end, 'h:mma')}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Dismiss</Button>
        <Button
          variant="contained"
          disabled={!preview || !preview.successes.length}
          onClick={() => {
            if (!preview) return;
            const nextSessions = sessions.map((session) => {
              const update = preview.successes.find((item) => item.sessionId === session.id);
              return update ? update.updated : session;
            });
            onApply(nextSessions, preview.message);
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type BatchPreview = {
  message: string;
  successes: { sessionId: string; updated: SessionCard }[];
  blocked: { sessionId: string; reason: string }[];
};

function buildBatchPreview({
  type,
  selectedSessions,
  allSessions,
  reason,
  offset,
  replacement,
  staffOptions
}: {
  type: 'cancel' | 'move' | 'reassign';
  selectedSessions: SessionCard[];
  allSessions: SessionCard[];
  reason: string;
  offset: number;
  replacement: string;
  staffOptions: AvailabilityItem[];
}): BatchPreview {
  const successes: BatchPreview['successes'] = [];
  const blocked: BatchPreview['blocked'] = [];

  if (type === 'cancel') {
    selectedSessions.forEach((session) => {
      if (session.status === 'Completed') {
        blocked.push({ sessionId: session.id, reason: `${session.client} already completed; cannot cancel.` });
      } else if (session.status === 'Cancelled') {
        blocked.push({ sessionId: session.id, reason: `${session.client} is already cancelled.` });
      } else {
        successes.push({ sessionId: session.id, updated: { ...session, status: 'Cancelled' } });
      }
    });
    const message = successes.length
      ? `${successes.length} session${successes.length === 1 ? '' : 's'} cancelled (${reason})${blocked.length ? ` · ${blocked.length} skipped` : ''}`
      : 'No sessions eligible for cancellation';
    return { message, successes, blocked };
  }

  if (type === 'move') {
    selectedSessions.forEach((session) => {
      const newStart = addMinutes(session.start, offset);
      const newEnd = addMinutes(session.end, offset);
      const conflict = allSessions.find((other) => {
        if (other.id === session.id) return false;
        const sameStaff = session.laneId && other.laneId === session.laneId;
        const sameClient = session.clientId && other.clientId === session.clientId;
        if (!sameStaff && !sameClient) return false;
        return sessionsOverlap(newStart, newEnd, other.start, other.end);
      });
      if (conflict) {
        blocked.push({
          sessionId: session.id,
          reason: `${session.client} conflicts with ${conflict.client} at ${format(conflict.start, 'MMM d h:mma')}`
        });
      } else {
        successes.push({ sessionId: session.id, updated: { ...session, start: newStart, end: newEnd } });
      }
    });
    const message = successes.length
      ? `${successes.length} session${successes.length === 1 ? '' : 's'} shifted ${offset} min${blocked.length ? ` · ${blocked.length} skipped` : ''}`
      : 'No sessions can be moved without conflicts';
    return { message, successes, blocked };
  }

  const replacementStaff = staffOptions.find((staff) => staff.staffId === replacement);
  selectedSessions.forEach((session) => {
    if (!replacement) {
      blocked.push({ sessionId: session.id, reason: 'Choose replacement staff to proceed.' });
      return;
    }
    if (session.laneId === replacement) {
      blocked.push({ sessionId: session.id, reason: `${session.client} already assigned to ${replacementStaff?.staffName ?? replacement}.` });
      return;
    }
    const conflict = allSessions.find((other) => {
      if (other.id === session.id) return false;
      if (other.laneId !== replacement) return false;
      return sessionsOverlap(session.start, session.end, other.start, other.end);
    });
    if (conflict) {
      blocked.push({
        sessionId: session.id,
        reason: `${replacementStaff?.staffName ?? 'Replacement'} busy with ${conflict.client} at ${format(conflict.start, 'MMM d h:mma')}`
      });
    } else {
      successes.push({ sessionId: session.id, updated: { ...session, laneId: replacement } });
    }
  });

  const message = successes.length
    ? `${successes.length} session${successes.length === 1 ? '' : 's'} reassigned to ${replacementStaff?.staffName ?? 'new staff'}${blocked.length ? ` · ${blocked.length} skipped` : ''}`
    : 'No sessions can be reassigned without conflicts';
  return { message, successes, blocked };
}

function sessionsOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}
function HighlightDetailPanel({
  type,
  data,
  onClose,
  onLaunchSuggestion
}: {
  type: 'makeup' | 'underutilized' | 'waitlist';
  data: typeof highlightDetails;
  onClose: () => void;
  onLaunchSuggestion: (payload: string) => void;
}) {
  if (type === 'makeup') {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Clients needing make-up hours</Typography>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Divider />
        <Stack spacing={2}>
          {data.makeup.map((entry) => (
            <Paper key={entry.client} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {entry.client}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target {entry.target}h · Scheduled {entry.scheduled}h · Gap {entry.gap}h
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <Chip label={`Staff ${entry.staff}`} size="small" />
                <Chip label={entry.payer} size="small" />
              </Stack>
              <Button sx={{ mt: 1 }} size="small" variant="contained" onClick={() => onLaunchSuggestion(entry.client)}>
                Find suggested slots
              </Button>
            </Paper>
          ))}
        </Stack>
      </Paper>
    );
  }
  if (type === 'underutilized') {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Underutilized windows</Typography>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Divider />
        <Stack spacing={2}>
          {data.underutilized.map((entry) => (
            <Paper key={entry.window} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {entry.window}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {entry.location} · {entry.staff}
              </Typography>
              <Typography variant="body2">{entry.note}</Typography>
              <Button
                sx={{ mt: 1 }}
                size="small"
                variant="outlined"
                onClick={() => onLaunchSuggestion(`${entry.window} at ${entry.location}`)}
              >
                View window
              </Button>
            </Paper>
          ))}
        </Stack>
      </Paper>
    );
  }
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Waitlist matches</Typography>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Stack>
      <Divider />
      <Stack spacing={2}>
        {data.waitlist.map((entry) => (
          <Paper key={entry.client} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {entry.client}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prefers {entry.preferred} · {entry.setting}
            </Typography>
            <Typography variant="body2">Needs {entry.hours} hrs/week</Typography>
            <Typography variant="body2">{entry.note}</Typography>
            <Button sx={{ mt: 1 }} size="small" variant="contained" onClick={() => onLaunchSuggestion(entry.client)}>
              Start scheduling
            </Button>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
