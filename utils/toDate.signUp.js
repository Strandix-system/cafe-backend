export const toDate = (unixTime) => {
  if (!unixTime) return null;
  return new Date(unixTime * 1000);
};