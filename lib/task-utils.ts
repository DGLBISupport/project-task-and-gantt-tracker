import { TaskItem, PriorityLevel, TaskStatus } from "@/types/task";

export const SAMPLE_TASKS: TaskItem[] = [
  {
    id: "task-1",
    category: "BI & Analytics",
    mainProject: "Enterprise Sales Analytics",
    keyProjectDeliveries: "Executive KPI Dashboard",
    taskName: "Define Revenue & Margin Metrics",
    priority: "High",
    status: "Completed",
    resource: "Anjalee K.",
    startDate: "2026-10-01",
    endDate: "2026-10-07",
    progress: 100,
    comments: "Metrics signed off by CFO and VP of Sales.",
  },
  {
    id: "task-2",
    category: "Data Engineering",
    mainProject: "Enterprise Sales Analytics",
    keyProjectDeliveries: "ETL Pipeline v2",
    taskName: "Build Snowflake Sales Data Ingestion",
    priority: "Critical",
    status: "Completed",
    resource: "David Chen",
    startDate: "2026-10-05",
    endDate: "2026-10-14",
    progress: 100,
    comments: "Automated incremental refresh configured every 2 hours.",
  },
  {
    id: "task-3",
    category: "BI & Analytics",
    mainProject: "Enterprise Sales Analytics",
    keyProjectDeliveries: "Executive KPI Dashboard",
    taskName: "Develop PowerBI Interactive Visuals",
    priority: "High",
    status: "In Progress",
    resource: "Anjalee K.",
    startDate: "2026-10-12",
    endDate: "2026-10-24",
    progress: 70,
    comments: "Drill-down filters and regional breakdown being refined.",
  },
  {
    id: "task-4",
    category: "Data Governance",
    mainProject: "Enterprise Sales Analytics",
    keyProjectDeliveries: "Security & Compliance",
    taskName: "Implement Row-Level Security (RLS)",
    priority: "Critical",
    status: "In Progress",
    resource: "Elena Rostova",
    startDate: "2026-10-16",
    endDate: "2026-10-26",
    progress: 50,
    comments: "Assigning user security groups per geographical market.",
  },
  {
    id: "task-5",
    category: "QA & Testing",
    mainProject: "Enterprise Sales Analytics",
    keyProjectDeliveries: "User Acceptance Testing",
    taskName: "Conduct Stakeholder UAT Sign-off",
    priority: "High",
    status: "Not Started",
    resource: "Marcus Vance",
    startDate: "2026-10-25",
    endDate: "2026-11-04",
    progress: 0,
    comments: "Test scripts distributed to regional sales managers.",
  },
  {
    id: "task-6",
    category: "Data Engineering",
    mainProject: "Supply Chain Real-time Tracker",
    keyProjectDeliveries: "Kafka Streaming Ingestion",
    taskName: "Configure IoT Sensor Telemetry Stream",
    priority: "High",
    status: "In Progress",
    resource: "David Chen",
    startDate: "2026-10-08",
    endDate: "2026-10-22",
    progress: 80,
    comments: "Latency under 300ms achieved in staging tests.",
  },
  {
    id: "task-7",
    category: "BI & Analytics",
    mainProject: "Supply Chain Real-time Tracker",
    keyProjectDeliveries: "Warehouse Fleet Gantt",
    taskName: "Build Inventory Turnover Reports",
    priority: "Medium",
    status: "Under Review",
    resource: "Priya Sharma",
    startDate: "2026-10-15",
    endDate: "2026-10-28",
    progress: 90,
    comments: "Awaiting warehouse manager validation on safety stock formula.",
  },
  {
    id: "task-8",
    category: "Operations",
    mainProject: "Supply Chain Real-time Tracker",
    keyProjectDeliveries: "Logistics Optimization",
    taskName: "Route Efficiency & Fuel Consumption Model",
    priority: "Medium",
    status: "Delayed",
    resource: "Alex Rivera",
    startDate: "2026-10-06",
    endDate: "2026-10-20",
    progress: 40,
    comments: "Delayed due to delayed GPS vendor API tokens.",
  },
  {
    id: "task-9",
    category: "Finance BI",
    mainProject: "Financial Reporting Automation",
    keyProjectDeliveries: "General Ledger Consolidation",
    taskName: "Automate Multi-Currency Reconciliation",
    priority: "Critical",
    status: "In Progress",
    resource: "Priya Sharma",
    startDate: "2026-10-14",
    endDate: "2026-10-31",
    progress: 65,
    comments: "ECB exchange rate feed connected successfully.",
  },
  {
    id: "task-10",
    category: "Finance BI",
    mainProject: "Financial Reporting Automation",
    keyProjectDeliveries: "Audit & Month-End Reports",
    taskName: "Build P&L Variance Decomposition",
    priority: "High",
    status: "Not Started",
    resource: "Anjalee K.",
    startDate: "2026-10-28",
    endDate: "2026-11-12",
    progress: 0,
    comments: "Ready to start immediately after reconciliation validation.",
  },
];

export function normalizeDate(dateStr: string | undefined): string {
  if (!dateStr || !dateStr.trim()) {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  const clean = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Handle DD/MM/YYYY or MM/DD/YYYY
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}-${month}-${day}`;
    } else if (parts[2].length === 4) {
      // DD/MM/YYYY or MM/DD/YYYY
      const year = parts[2];
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      // If p1 > 12, it must be DD/MM/YYYY
      if (p1 > 12) {
        return `${year}-${String(p2).padStart(2, "0")}-${String(p1).padStart(2, "0")}`;
      } else {
        // Assume YYYY-MM-DD or standard
        return `${year}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
      }
    }
  }

  // Handle Excel Serial Number (e.g. 45580)
  const num = Number(clean);
  if (!isNaN(num) && num > 35000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + num * 86400000);
    return dateObj.toISOString().split("T")[0];
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

export function computeDefaultStartDate(endDateStr: string, daysBack: number = 7): string {
  const normEnd = normalizeDate(endDateStr);
  const date = new Date(normEnd);
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split("T")[0];
}

export function parseExcelOrCsv(rawContent: string): {
  tasks: TaskItem[];
  errors: string[];
} {
  const errors: string[] = [];
  const tasks: TaskItem[] = [];

  const lines = rawContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      tasks: [],
      errors: ["Data contains no content or is missing rows."],
    };
  }

  // Detect delimiter: tab (\t) or comma (,)
  const firstLine = lines[0];
  const isTab = firstLine.includes("\t");
  const delimiter = isTab ? "\t" : ",";

  const parseRow = (line: string): string[] => {
    if (delimiter === "\t") {
      return line.split("\t").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    // Simple CSV parser supporting quotes
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        cells.push(currentCell.trim().replace(/^["']|["']$/g, ""));
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^["']|["']$/g, ""));
    return cells;
  };

  // Scan the first few rows to locate the header row (in case row 1 is a title or blank)
  let headerRowIndex = 0;
  let headers: string[] = [];
  let colTaskName = -1;
  let colEndDate = -1;
  let colCategory = -1;
  let colMainProject = -1;
  let colDeliveries = -1;
  let colPriority = -1;
  let colStatus = -1;
  let colResource = -1;
  let colStartDate = -1;
  let colComments = -1;

  for (let r = 0; r < Math.min(10, lines.length); r++) {
    const candidateHeaders = parseRow(lines[r]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const findInRow = (aliases: string[]): number => candidateHeaders.findIndex((h) => aliases.some((a) => h.includes(a)));

    const testTaskName = findInRow(["taskname", "task", "activity", "name", "title"]);
    const testEndDate = findInRow(["enddate", "end", "duedate", "deadline", "targetdate"]);
    const testProject = findInRow(["mainproject", "project", "projectname"]);
    const testCategory = findInRow(["category", "cat"]);

    // If at least two key columns match, or task name matches with another column
    const matches = [testTaskName, testEndDate, testProject, testCategory].filter((idx) => idx !== -1).length;
    if (matches >= 2 || (testTaskName !== -1 && testEndDate !== -1)) {
      headerRowIndex = r;
      headers = candidateHeaders;
      colTaskName = testTaskName;
      colEndDate = testEndDate;
      colMainProject = testProject;
      colCategory = testCategory;
      colDeliveries = findInRow(["keyprojectdeliveries", "deliveries", "deliverable", "keydeliver"]);
      colPriority = findInRow(["priority", "urgency", "prio"]);
      colStatus = findInRow(["status", "state", "progressstatus"]);
      colResource = findInRow(["resource", "owner", "assignee", "assigned", "lead"]);
      colStartDate = findInRow(["startdate", "start", "begin"]);
      colComments = findInRow(["comments", "comment", "notes", "description", "remark"]);
      break;
    }
  }

  // Fallback if no specific header matched
  if (headers.length === 0) {
    headerRowIndex = 0;
    headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const findCol = (aliases: string[]): number => headers.findIndex((h) => aliases.some((a) => h.includes(a)));
    colCategory = findCol(["category", "cat"]);
    colMainProject = findCol(["mainproject", "project", "projectname"]);
    colDeliveries = findCol(["keyprojectdeliveries", "deliveries", "deliverable", "keydeliver"]);
    colTaskName = findCol(["taskname", "task", "activity", "name", "title"]);
    colPriority = findCol(["priority", "urgency", "prio"]);
    colStatus = findCol(["status", "state", "progressstatus"]);
    colResource = findCol(["resource", "owner", "assignee", "assigned", "lead"]);
    colEndDate = findCol(["enddate", "end", "duedate", "deadline", "targetdate"]);
    colStartDate = findCol(["startdate", "start", "begin"]);
    colComments = findCol(["comments", "comment", "notes", "description", "remark"]);
  }

  if (colTaskName === -1 && colEndDate === -1 && colMainProject === -1) {
    return {
      tasks: [],
      errors: [
        "Could not detect expected columns (Task Name or End Date). Please ensure header matches: Category, Main Project, Key Project Deliveries, Task Name, Priority, Status, Resource, End Date, Comments.",
      ],
    };
  }

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    const taskName = colTaskName !== -1 && cells[colTaskName] ? cells[colTaskName] : `Task ${i}`;
    const category = colCategory !== -1 && cells[colCategory] ? cells[colCategory] : "General";
    const mainProject = colMainProject !== -1 && cells[colMainProject] ? cells[colMainProject] : "Main Project";
    const keyDeliveries = colDeliveries !== -1 && cells[colDeliveries] ? cells[colDeliveries] : "Deliverable 1";
    
    let priority: PriorityLevel = "Medium";
    if (colPriority !== -1 && cells[colPriority]) {
      const p = cells[colPriority].toLowerCase();
      if (p.includes("crit")) priority = "Critical";
      else if (p.includes("high")) priority = "High";
      else if (p.includes("low")) priority = "Low";
      else priority = "Medium";
    }

    let status: TaskStatus = "Not Started";
    let progress = 0;
    if (colStatus !== -1 && cells[colStatus]) {
      const s = cells[colStatus].toLowerCase();
      if (s.includes("complete") || s.includes("done") || s.includes("finish")) {
        status = "Completed";
        progress = 100;
      } else if (s.includes("progress") || s.includes("doing") || s.includes("wip")) {
        status = "In Progress";
        progress = 50;
      } else if (s.includes("review") || s.includes("testing") || s.includes("qa")) {
        status = "Under Review";
        progress = 85;
      } else if (s.includes("delay") || s.includes("hold") || s.includes("block")) {
        status = "Delayed";
        progress = 30;
      } else {
        status = "Not Started";
        progress = 0;
      }
    }

    const resource = colResource !== -1 && cells[colResource] ? cells[colResource] : "Unassigned";
    const endDateRaw = colEndDate !== -1 && cells[colEndDate] ? cells[colEndDate] : "";
    const endDate = normalizeDate(endDateRaw);

    let startDate = "";
    if (colStartDate !== -1 && cells[colStartDate]) {
      startDate = normalizeDate(cells[colStartDate]);
    } else {
      // Default to 7 days before End Date
      startDate = computeDefaultStartDate(endDate, 7);
    }

    // Ensure start <= end
    if (new Date(startDate) > new Date(endDate)) {
      startDate = computeDefaultStartDate(endDate, 5);
    }

    const comments = colComments !== -1 && cells[colComments] ? cells[colComments] : "";

    tasks.push({
      id: `task-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      mainProject,
      keyProjectDeliveries: keyDeliveries,
      taskName,
      priority,
      status,
      resource,
      startDate,
      endDate,
      progress,
      comments,
    });
  }

  return { tasks, errors };
}

export function exportToCsv(tasks: TaskItem[]): string {
  const headers = [
    "Category",
    "Main Project",
    "Key Project Deliveries",
    "Task Name",
    "Priority",
    "Status",
    "Resource",
    "End Date",
    "Comments",
  ];

  const escapeCsv = (str: string | undefined): string => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = tasks.map((t) => [
    escapeCsv(t.category),
    escapeCsv(t.mainProject),
    escapeCsv(t.keyProjectDeliveries),
    escapeCsv(t.taskName),
    escapeCsv(t.priority),
    escapeCsv(t.status),
    escapeCsv(t.resource),
    escapeCsv(t.endDate),
    escapeCsv(t.comments || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export function downloadCsvFile(content: string, filename: string = "project_tasks.csv") {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTemplateCsv() {
  const templateTasks: TaskItem[] = [
    {
      id: "1",
      category: "BI & Analytics",
      mainProject: "Sales Performance Tracker",
      keyProjectDeliveries: "Executive Dashboard",
      taskName: "Build Revenue & Cost Metrics",
      priority: "High",
      status: "In Progress",
      resource: "Anjalee K.",
      startDate: "2026-10-15",
      endDate: "2026-10-25",
      comments: "Data model complete, creating visuals.",
    },
    {
      id: "2",
      category: "Data Engineering",
      mainProject: "Sales Performance Tracker",
      keyProjectDeliveries: "Data Pipeline",
      taskName: "Automate Daily CRM Data Sync",
      priority: "Critical",
      status: "Completed",
      resource: "David Chen",
      startDate: "2026-10-10",
      endDate: "2026-10-18",
      comments: "Live in production with airbyte connector.",
    },
    {
      id: "3",
      category: "Quality Assurance",
      mainProject: "Sales Performance Tracker",
      keyProjectDeliveries: "Validation & Testing",
      taskName: "Reconciliation against Source ERP",
      priority: "Medium",
      status: "Not Started",
      resource: "Marcus Vance",
      startDate: "2026-10-24",
      endDate: "2026-10-30",
      comments: "Scheduled for next sprint review.",
    },
  ];

  const csvContent = exportToCsv(templateTasks);
  downloadCsvFile(csvContent, "task_template_excel_format.csv");
}
