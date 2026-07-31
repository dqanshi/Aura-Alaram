import { CalendarEvent } from '../types';

const STORAGE_KEY_CALENDAR = 'aura__calendar_v1';

const DEFAULT_EVENTS: CalendarEvent[] = [
  { id: 'evt_1', title: 'Orbital Tech Briefing', time: '09:00', location: 'Command Deck A' },
  { id: 'evt_2', title: 'Reactor Core Calibration', time: '11:30', location: 'Engineering Bay 4' },
  { id: 'evt_3', title: 'Cybernetic Team Sync', time: '14:00', location: 'Virtual VR Room 2' },
];

export const loadCalendarEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  saveCalendarEvents(DEFAULT_EVENTS);
  return DEFAULT_EVENTS;
};

export const saveCalendarEvents = (events: CalendarEvent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(events));
  } catch {}
};

// Calculate smart snooze duration based on nearest upcoming calendar event
export const calculateSmartSnooze = (events: CalendarEvent[], nowTimeStr: string): { snoozeMinutes: number; eventTitle: string; eventTime: string } => {
  if (events.length === 0) {
    return { snoozeMinutes: 5, eventTitle: 'No Upcoming Events', eventTime: 'N/A' };
  }

  const [nh, nm] = nowTimeStr.split(':').map(Number);
  const nowMins = nh * 60 + nm;

  // Find events occurring today after now
  const upcoming = events
    .map(e => {
      const [eh, em] = e.time.split(':').map(Number);
      let eventMins = eh * 60 + em;
      if (eventMins <= nowMins) {
        eventMins += 24 * 60; // Next day
      }
      return {
        event: e,
        diffMins: eventMins - nowMins,
      };
    })
    .sort((a, b) => a.diffMins - b.diffMins);

  const nearest = upcoming[0];
  if (!nearest) {
    return { snoozeMinutes: 5, eventTitle: 'No Upcoming Events', eventTime: 'N/A' };
  }

  // Calculate smart snooze duration so user wakes up 15 minutes before the event, capped between 3m and 30m
  let smartMins = Math.max(3, nearest.diffMins - 15);
  if (smartMins > 30) smartMins = 10; // Default reasonable chunk if event is far

  return {
    snoozeMinutes: smartMins,
    eventTitle: nearest.event.title,
    eventTime: nearest.event.time,
  };
};
