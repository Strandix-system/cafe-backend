export const convertToBaseUnit = (qty, unit) => {
  switch (unit) {
    case 'ml':
      return qty;

    case 'l':
      return qty * 1000;

    case 'g':
      return qty;

    case 'kg':
      return qty * 1000;

    case 'pcs':
      return qty;

    case 'dozen':
      return qty * 12;

    default:
      throw new Error('Invalid unit');
  }
};
