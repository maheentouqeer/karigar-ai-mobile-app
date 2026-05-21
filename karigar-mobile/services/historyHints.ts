/** Smart home reminder from persisted service history + season. */

export interface ReminderCard {
  title: string;
  desc: string;
  btn: string;
  query: string;
  icon: string;
  color: string;
  source: 'history' | 'season' | 'default';
}

const HISTORY_REMINDERS: Record<string, Omit<ReminderCard, 'source'>> = {
  AC_repair: {
    title: 'Time for AC checkup?',
    desc: 'You booked AC service before — slots fill fast in summer.',
    btn: 'Book AC Again',
    query: 'AC maintenance chahiye G-13 budget 600 urgent',
    icon: 'snow',
    color: '#3498DB',
  },
  plumbing: {
    title: 'Plumbing follow-up',
    desc: 'Based on your last booking — book a plumber before leaks worsen.',
    btn: 'Book Plumber',
    query: 'Plumber chahiye pipe check G-13 budget 500',
    icon: 'water',
    color: '#34495E',
  },
  tutoring: {
    title: 'Continue tutoring?',
    desc: 'Your last tutor search — book again for exam prep.',
    btn: 'Find Tutor',
    query: 'O Level Math home tutor G-13 budget 6000',
    icon: 'school',
    color: '#F39C12',
  },
  electrical: {
    title: 'Electrical safety check',
    desc: 'You used electrical services — schedule a wiring inspection.',
    btn: 'Book Electrician',
    query: 'Electrician chahiye wiring G-9 budget 700',
    icon: 'flash',
    color: '#E74C3C',
  },
  home_cleaning: {
    title: 'Home cleaning due?',
    desc: 'Repeat your last cleaning booking this week.',
    btn: 'Book Cleaning',
    query: 'Ghar ki safai kal dopahar G-13 budget 1500',
    icon: 'home',
    color: '#16A085',
  },
};

function seasonalReminder(month: number): ReminderCard {
  const isSummer = month >= 4 && month <= 8;
  const isWinter = month === 11 || month <= 1;
  const isExamSeason = month === 3 || month === 4;

  if (isSummer) {
    return {
      title: 'Summer is here',
      desc: 'Schedule your AC maintenance before slots fill up!',
      btn: 'Book AC Checkup',
      query: 'I need AC maintenance urgently G-13 budget 500',
      icon: 'snow',
      color: '#3498DB',
      source: 'season',
    };
  }
  if (isWinter) {
    return {
      title: 'Winter arriving',
      desc: 'Get your geyser and heaters checked today.',
      btn: 'Find a Plumber',
      query: 'Geyser service plumber G-13 budget 600',
      icon: 'flame',
      color: '#E74C3C',
      source: 'season',
    };
  }
  if (isExamSeason) {
    return {
      title: 'Exam season',
      desc: 'Find verified tutors for your kids.',
      btn: 'Find a Tutor',
      query: 'Home tutor O Levels Math G-13 budget 8000',
      icon: 'school',
      color: '#F39C12',
      source: 'season',
    };
  }
  return {
    title: 'Top up service',
    desc: 'Need quick tasks done around the house?',
    btn: 'Explore local pros',
    query: 'I need a local pro for general home tasks G-13',
    icon: 'briefcase',
    color: '#0D7377',
    source: 'default',
  };
}

/** History wins over season when user has recent bookings. */
export function getSmartReminder(serviceHistory: string[], month = new Date().getMonth()): ReminderCard {
  if (serviceHistory.length > 0) {
    const recent = serviceHistory[0];
    const hint = HISTORY_REMINDERS[recent];
    if (hint) {
      return { ...hint, source: 'history' };
    }
  }
  return seasonalReminder(month);
}
