export const resolveAdminGst = (admin) => {
  const hasGstNumber = !!admin?.gst?.gstNumber;

  const gstPercent = hasGstNumber ? admin?.gst?.gstPercentage : null;
  const gstType = hasGstNumber ? admin?.gst?.gstType : null;

  return {
    hasGstNumber,
    gstPercent,
    gstType,
  };
};

export const calculateTotalsByGst = ({
  subTotal = 0,
  gstPercent = null,
  gstType = null,
  hasGstNumber = false,
}) => {
  let gstAmount = null;
  let finalTotal = subTotal;
  let taxableAmount = subTotal;

  if (hasGstNumber && gstType === 'inclusive') {
    gstAmount = (subTotal * gstPercent) / (100 + gstPercent);
    finalTotal = subTotal;
    taxableAmount = subTotal - gstAmount;
  } else if (hasGstNumber) {
    gstAmount = (subTotal * gstPercent) / 100;
    finalTotal = subTotal + gstAmount;
    taxableAmount = subTotal;
  }

  return {
    gstAmount,
    finalTotal,
    taxableAmount,
  };
};
