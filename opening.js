// Only the six client-confirmed weekends. Offsets explicitly follow Texas DST.
(() => {
  const weekends = [
    ['2026-11-20', 'November 20 & 21, 2026', '-06:00'],
    ['2026-12-18', 'December 18 & 19, 2026', '-06:00'],
    ['2027-01-15', 'January 15 & 16, 2027', '-06:00'],
    ['2027-02-19', 'February 19 & 20, 2027', '-06:00'],
    ['2027-03-19', 'March 19 & 20, 2027', '-05:00'],
    ['2027-04-16', 'April 16 & 17, 2027', '-05:00']
  ].map(([date, label, offset]) => {
    const saturday = new Date(date + 'T12:00:00Z');
    saturday.setUTCDate(saturday.getUTCDate() + 1);
    return {date, label, sessions: [date, saturday.toISOString().slice(0, 10)].map(day => ({
      start: Date.parse(day + 'T10:00:00' + offset),
      end: Date.parse(day + 'T17:00:00' + offset)
    }))};
  });
  function getState(now = Date.now()) {
    const weekend = weekends.find(w => w.sessions[1].end > now);
    const session = weekend?.sessions.find(s => s.end > now);
    let countdown = 'More dates to come. Call or text to plan an appointment.';
    if (session) {
      if (now >= session.start) countdown = 'Treasure-hunting time! Scheduled shopping hours until 5 pm.';
      else {
        const minutes = Math.ceil((session.start - now) / 60000);
        const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), mins = minutes % 60;
        countdown = `${days}d · ${hours}h · ${mins}m until the next rummage`;
      }
    }
    return {
      dateLabel: weekend?.label || 'Every third weekend of the month',
      hoursLabel: 'Friday & Saturday · 10 am–5 pm', countdown,
      calendar: weekend ? `assets/calendar/cherry-picked-chaos-${weekend.date}.ics` : null,
      session
    };
  }
  window.CPC_OPENING = getState();
  window.CPC_SCHEDULE = {getState};
})();
