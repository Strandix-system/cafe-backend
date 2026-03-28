const XML_DECLARATION = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>`;

const WORKBOOK_OPEN = `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">`;

const WORKBOOK_CLOSE = "</Workbook>";

const xmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sanitizeSheetName = (name) =>
  String(name ?? "Sheet")
    .replace(/[\\/*?:[\]]/g, " ")
    .slice(0, 31)
    .trim() || "Sheet";

const renderCell = (rawCell) => {
  const cell =
    typeof rawCell === "object" && rawCell !== null && "value" in rawCell
      ? rawCell
      : { value: rawCell };

  const { value = "", styleId } = cell;

  let type = cell.type;
  if (!type) {
    type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
  }

  const styleAttr = styleId ? ` ss:StyleID="${xmlEscape(styleId)}"` : "";

  if (type === "Number") {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return `<Cell${styleAttr}><Data ss:Type="Number">${numericValue}</Data></Cell>`;
    }
    return `<Cell${styleAttr}><Data ss:Type="Number">0</Data></Cell>`;
  }

  return `<Cell${styleAttr}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
};

const renderRow = (row) => `<Row>${row.map(renderCell).join("")}</Row>`;

const renderWorksheet = ({ name, rows }) => `
  <Worksheet ss:Name="${xmlEscape(sanitizeSheetName(name))}">
    <Table>
      ${rows.map(renderRow).join("\n")}
    </Table>
  </Worksheet>`;

const buildWorkbookXml = (worksheets) => {
  const styles = `
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="currency">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>`;

  const worksheetXml = worksheets.map(renderWorksheet).join("\n");

  return `${XML_DECLARATION}
${WORKBOOK_OPEN}
${styles}
${worksheetXml}
${WORKBOOK_CLOSE}`;
};

export const buildMonthlyRevenueWorkbook = ({
  admin,
  reportMonthLabel,
  summary,
  industry,
  dailyBreakdown,
}) => {
  const summaryRows = [
    [
      { value: "Metric", styleId: "header" },
      { value: "Value", styleId: "header" },
    ],
    ["Cafe Name", admin.cafeName || `${admin.firstName} ${admin.lastName}`],
    ["Admin Name", `${admin.firstName} ${admin.lastName}`],
    ["Admin Email", admin.email],
    ["Report Month", reportMonthLabel],
    [
      "Completed Orders",
      { value: summary.completedOrders, type: "Number" },
    ],
    ["Paid Orders", { value: summary.paidOrders, type: "Number" }],
    [
      "Total Revenue (INR)",
      { value: summary.revenue, type: "Number", styleId: "currency" },
    ],
    [
      "Average Order Value (INR)",
      { value: summary.averageOrderValue, type: "Number", styleId: "currency" },
    ],
    [
      "Previous Month Revenue (INR)",
      {
        value: summary.previousRevenue,
        type: "Number",
        styleId: "currency",
      },
    ],
    ["MoM Revenue Growth (%)", summary.growthPercent],
  ];

  const industryRows = [
    [
      { value: "Industry Metric", styleId: "header" },
      { value: "Value", styleId: "header" },
    ],
    [
      "Platform Revenue (INR)",
      {
        value: industry.platformRevenue,
        type: "Number",
        styleId: "currency",
      },
    ],
    ["Platform Completed Orders", { value: industry.platformOrders, type: "Number" }],
    ["Cafes With Sales", { value: industry.cafesWithSales, type: "Number" }],
    [
      "Average Revenue Per Cafe (INR)",
      {
        value: industry.averageRevenuePerCafe,
        type: "Number",
        styleId: "currency",
      },
    ],
    [
      "Platform Average Order Value (INR)",
      {
        value: industry.platformAverageOrderValue,
        type: "Number",
        styleId: "currency",
      },
    ],
    ["Top Cafe", industry.topCafeName],
    [
      "Top Cafe Revenue (INR)",
      { value: industry.topCafeRevenue, type: "Number", styleId: "currency" },
    ],
    ["Your Rank (By Revenue)", industry.rankLabel],
    ["Your Revenue Share (%)", industry.revenueSharePercent],
  ];

  const dailyRows = [
    [
      { value: "Date", styleId: "header" },
      { value: "Completed Orders", styleId: "header" },
      { value: "Revenue (INR)", styleId: "header" },
    ],
    ...dailyBreakdown.map((row) => [
      row.date,
      { value: row.completedOrders, type: "Number" },
      { value: row.revenue, type: "Number", styleId: "currency" },
    ]),
  ];

  const workbookXml = buildWorkbookXml([
    { name: "Summary", rows: summaryRows },
    { name: "Industry Snapshot", rows: industryRows },
    { name: "Daily Breakdown", rows: dailyRows },
  ]);

  return Buffer.from(workbookXml, "utf8");
};

