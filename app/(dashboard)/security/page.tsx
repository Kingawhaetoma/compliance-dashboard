export const dynamic = "force-dynamic";

type Alert = {
  id: string;
  timestamp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  agent: string;
  rule: string;
  summary: string;
};

const demoAlerts: Alert[] = [
  {
    id: "ALRT-10021",
    timestamp: new Date().toISOString(),
    severity: "High",
    agent: "ubuntu-server",
    rule: "SSH Brute Force",
    summary: "Multiple failed SSH logins detected from 185.23.xx.xx",
  },
  {
    id: "ALRT-10020",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    severity: "Medium",
    agent: "ubuntu-server",
    rule: "Suspicious Process",
    summary: "Unexpected process executed: /tmp/.x",
  },
  {
    id: "ALRT-10019",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: "Low",
    agent: "ubuntu-server",
    rule: "New User Created",
    summary: "New local user created: temp_admin",
  },
];

function badge(sev: Alert["severity"]) {
  const map: Record<Alert["severity"], string> = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };
  return map[sev];
}

export default function SecurityPage() {
  const total = demoAlerts.length;
  const highPlus = demoAlerts.filter(a => a.severity === "High" || a.severity === "Critical").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Security</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Portfolio demo view. Hook this up to Wazuh next.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grc-surface p-4">
          <div className="text-sm text-slate-600">Total Alerts</div>
          <div className="text-3xl font-bold text-slate-900">{total}</div>
        </div>

        <div className="grc-surface p-4">
          <div className="text-sm text-slate-600">High / Critical</div>
          <div className="text-3xl font-bold text-slate-900">{highPlus}</div>
        </div>

        <div className="grc-surface p-4">
          <div className="text-sm text-slate-600">Monitored Host</div>
          <div className="text-xl font-semibold text-slate-900">ubuntu-server</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 p-4">
          <h2 className="font-semibold text-slate-900">Latest Alerts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Severity</th>
                <th className="text-left p-3">Agent</th>
                <th className="text-left p-3">Rule</th>
                <th className="text-left p-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {demoAlerts.map(a => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge(a.severity)}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3">{a.agent}</td>
                  <td className="p-3">{a.rule}</td>
                  <td className="p-3">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          Next upgrade: replace demoAlerts with data from /api/security/alerts (Wazuh relay).
        </div>
      </div>
    </div>
  );
}
