const getUtcDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

const getCurrentUtcDayRange = (date = new Date()) => {
  const start = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

  const end = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  return { start, end };
};

const getCurrentUtcYearRange = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
  );

  return { start, end };
};

export { getUtcDateRange, getCurrentUtcDayRange, getCurrentUtcYearRange };
