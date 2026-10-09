import { Check, CircleHelp, LockKeyhole, ShieldCheck } from "lucide-react";

export function AuditPanel() {
  return (
    <aside aria-label="Security audit dashboard" className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <ShieldCheck aria-hidden="true" size={17} />
          Security overview
        </h1>
        <span className="phase-badge">Phase 1 · Workspace</span>
      </div>

      <div className="dashboard-content">
        <section className="welcome-card">
          <div aria-hidden="true" className="welcome-icon">
            <LockKeyhole size={19} />
          </div>
          <h2>Your review workspace is ready</h2>
          <p>
            Load a repository or open local files to prepare code for security
            review. Audit results will appear here in the next phase.
          </p>
          <ul className="checklist">
            <li>
              <Check aria-hidden="true" size={14} />
              Edit source with syntax-aware highlighting
            </li>
            <li>
              <Check aria-hidden="true" size={14} />
              Browse public GitHub repositories
            </li>
            <li>
              <Check aria-hidden="true" size={14} />
              Keep your theme preference between visits
            </li>
          </ul>
        </section>

        <section className="info-card">
          <h2 className="info-card-heading">
            <CircleHelp aria-hidden="true" size={14} />
            About this workspace
          </h2>
          <p>
            Phase 1 provides file loading and code editing. AI analysis is not
            enabled yet, so no audit score or findings are being generated.
          </p>
        </section>
      </div>
    </aside>
  );
}
