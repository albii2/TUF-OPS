import { useState, useEffect, useCallback } from 'react';
import {
  getInboxEmails,
  getInboxStats,
  pollInboxes,
  analyzeEmail,
  EmailInboxWithAnalysis,
  EmailClassification,
  EmailPriority,
  InboxStats,
  getPriorityColor,
  getPriorityBgColor,
  getClassificationLabel,
  getClassificationColor,
} from '../services/emailInboxService';

type TabFilter = 'all' | 'unprocessed' | 'critical' | 'high';

const ACCOUNT_OPTIONS = [
  { key: '', label: 'All Accounts' },
  { key: 'abradshaw', label: 'Alex Bradshaw' },
  { key: 'hr', label: 'HR' },
  { key: 'order', label: 'Orders' },
];

const CLASSIFICATION_OPTIONS: Array<{ key: EmailClassification | ''; label: string }> = [
  { key: '', label: 'All Types' },
  { key: 'order_related', label: 'Orders' },
  { key: 'hr_related', label: 'HR' },
  { key: 'sales_related', label: 'Sales' },
  { key: 'general_inquiry', label: 'General' },
  { key: 'urgent', label: '⚠️ Urgent' },
];

export default function EmailInboxPage() {
  const [emails, setEmails] = useState<EmailInboxWithAnalysis[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [accountFilter, setAccountFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<EmailClassification | ''>('');
  const [error, setError] = useState<string | null>(null);

  const loadEmails = useCallback(async () => {
    try {
      setError(null);
      const result = await getInboxEmails({
        account: accountFilter || undefined,
        classification: classificationFilter || undefined,
        limit: 100,
      });
      setEmails(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load emails');
    }
  }, [accountFilter, classificationFilter]);

  const loadStats = useCallback(async () => {
    try {
      const s = await getInboxStats();
      setStats(s);
    } catch {
      // stats are non-critical
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEmails(), loadStats()]).finally(() => setLoading(false));
  }, [loadEmails, loadStats]);

  const handlePoll = async () => {
    setPolling(true);
    try {
      const result = await pollInboxes();
      alert(
        `Polled ${result.poll.totalFetched} new emails, ` +
        `processed ${result.processed.processed} pending.`,
      );
      await Promise.all([loadEmails(), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Poll failed');
    } finally {
      setPolling(false);
    }
  };

  const handleAnalyze = async (id: number) => {
    try {
      await analyzeEmail(id);
      await Promise.all([loadEmails(), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    }
  };

  const filteredEmails = emails.filter((e) => {
    if (activeTab === 'critical') return e.analysis?.priority === 'critical';
    if (activeTab === 'high') return e.analysis?.priority === 'high';
    if (activeTab === 'unprocessed') return !e.processed;
    return true;
  });

  const priorityBadge = (priority: EmailPriority) => (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: getPriorityBgColor(priority),
        color: getPriorityColor(priority),
        border: `1px solid ${getPriorityColor(priority)}`,
      }}
    >
      {priority.toUpperCase()}
    </span>
  );

  const classificationBadge = (classification: EmailClassification) => (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: `${getClassificationColor(classification)}10`,
        color: getClassificationColor(classification),
        border: `1px solid ${getClassificationColor(classification)}30`,
      }}
    >
      {getClassificationLabel(classification)}
    </span>
  );

  if (loading && emails.length === 0) {
    return <div style={{ padding: 24, color: '#6b7280' }}>Loading inbox...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📬 Email Inbox</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            {stats ? `${stats.total} total · ${stats.unprocessed} unprocessed` : 'Loading stats...'}
          </p>
        </div>
        <button
          onClick={handlePoll}
          disabled={polling}
          style={{
            padding: '10px 24px',
            backgroundColor: polling ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: polling ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {polling ? '⏳ Polling...' : '🔄 Poll Now'}
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
          padding: '12px 16px', background: '#f9fafb', borderRadius: 8,
        }}>
          {Object.entries(stats.byPriority).map(([p, count]) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: getPriorityColor(p as EmailPriority),
              }} />
              <span style={{ fontSize: 13, color: '#374151' }}>
                {p}: <strong>{count}</strong>
              </span>
            </div>
          ))}
          <div style={{ flexGrow: 1 }} />
          {Object.entries(stats.byAccount).map(([acct, count]) => (
            <span key={acct} style={{ fontSize: 13, color: '#6b7280' }}>
              {acct}: <strong>{count}</strong>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px 16px', background: '#fef2f2', color: '#dc2626',
          borderRadius: 8, marginBottom: 16,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Tabs */}
        {(['all', 'unprocessed', 'critical', 'high'] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: activeTab === tab ? '#2563eb' : '#f3f4f6',
              color: activeTab === tab ? '#fff' : '#374151',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {tab === 'all' ? 'All' : tab === 'unprocessed' ? 'Pending' : tab.toUpperCase()}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

        {/* Account filter */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
            fontSize: 13, background: '#fff',
          }}
        >
          {ACCOUNT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        {/* Classification filter */}
        <select
          value={classificationFilter}
          onChange={(e) => setClassificationFilter(e.target.value as EmailClassification | '')}
          style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
            fontSize: 13, background: '#fff',
          }}
        >
          {CLASSIFICATION_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Email list */}
      {filteredEmails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>No emails match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
                background: !email.processed ? '#fefce8' : '#fff',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
              onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
            >
              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Account indicator */}
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  backgroundColor: email.account === 'abradshaw' ? '#dbeafe' :
                    email.account === 'hr' ? '#fce7f3' : '#d1fae5',
                  color: email.account === 'abradshaw' ? '#1d4ed8' :
                    email.account === 'hr' ? '#be185d' : '#047857',
                }}>
                  {email.account.toUpperCase()}
                </span>

                {/* Unprocessed indicator */}
                {!email.processed && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: '#f59e0b', flexShrink: 0,
                  }} title="Pending analysis" />
                )}

                {/* Sender */}
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', flexShrink: 0 }}>
                  {email.sender_name || email.sender_email}
                </span>

                {/* Subject */}
                <span style={{ fontSize: 14, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.subject || '(no subject)'}
                </span>

                {/* Analysis badges */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {email.analysis?.classification && classificationBadge(email.analysis.classification)}
                  {email.analysis?.priority && priorityBadge(email.analysis.priority)}
                  {!email.analysis && !email.processed && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(email.id); }}
                      style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none',
                        backgroundColor: '#2563eb', color: '#fff', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Analyze
                    </button>
                  )}
                  {email.analysis?.linked_issue_id && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      backgroundColor: '#fef2f2', color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}>
                      Issue #{email.analysis.linked_issue_id}
                    </span>
                  )}
                  {email.analysis?.linked_work_item_id && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      backgroundColor: '#fefce8', color: '#ca8a04',
                      border: '1px solid #fde68a',
                    }}>
                      Task #{email.analysis.linked_work_item_id}
                    </span>
                  )}
                </div>

                {/* Date */}
                <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>
                  {new Date(email.received_at).toLocaleDateString()}
                </span>
              </div>

              {/* Expanded detail */}
              {expandedId === email.id && (
                <div
                  style={{ marginTop: 12, padding: 16, background: '#f9fafb', borderRadius: 6, fontSize: 14 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>From</div>
                      <div>{email.sender_name && <strong>{email.sender_name}</strong>} {email.sender_email}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>To</div>
                      <div>{email.recipient_email}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Subject</div>
                      <div>{email.subject || '(no subject)'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Received</div>
                      <div>{new Date(email.received_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Analysis section */}
                  {email.analysis && (
                    <div style={{
                      border: '1px solid #d1d5db', borderRadius: 6, padding: 16,
                      background: '#fff', marginBottom: 16,
                    }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
                        🤖 AI Analysis
                      </h3>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Classification: </span>
                          {classificationBadge(email.analysis.classification)}
                        </div>
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Priority: </span>
                          {priorityBadge(email.analysis.priority)}
                        </div>
                        {email.analysis.detected_org_name && (
                          <div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>Organization: </span>
                            <strong>{email.analysis.detected_org_name}</strong>
                          </div>
                        )}
                        {email.analysis.detected_contact && (
                          <div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>Contact: </span>
                            <strong>{email.analysis.detected_contact}</strong>
                          </div>
                        )}
                      </div>
                      {email.analysis.urgency_signals?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Urgency Signals: </span>
                          {email.analysis.urgency_signals.map((s, i) => (
                            <span key={i} style={{
                              display: 'inline-block', margin: '2px 4px', padding: '2px 8px',
                              borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626',
                              fontSize: 12,
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {email.analysis.ai_summary && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Summary: </span>
                          <span style={{ color: '#374151' }}>{email.analysis.ai_summary}</span>
                        </div>
                      )}
                      {email.analysis.suggested_action && (
                        <div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Suggested Action: </span>
                          <span style={{ color: '#2563eb', fontWeight: 500 }}>{email.analysis.suggested_action}</span>
                        </div>
                      )}
                      {!email.analysis.linked_issue_id && !email.analysis.linked_work_item_id && (
                        <button
                          onClick={() => handleAnalyze(email.id)}
                          style={{
                            marginTop: 12, padding: '6px 16px', borderRadius: 6,
                            backgroundColor: '#2563eb', color: '#fff', border: 'none',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          Re-Analyze & Create Issue
                        </button>
                      )}
                    </div>
                  )}

                  {/* Email body */}
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Body</div>
                  <div style={{
                    maxHeight: 400, overflow: 'auto', padding: 16,
                    background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb',
                    fontSize: 14, lineHeight: 1.6, color: '#374151',
                  }}>
                    {email.body_text ? (
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                        {email.body_text}
                      </pre>
                    ) : email.body_html ? (
                      <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>(no body)</span>
                    )}
                  </div>

                  {/* Attachments */}
                  {email.has_attachments && email.attachment_info?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                        📎 Attachments ({email.attachment_info.length})
                      </div>
                      {email.attachment_info.map((att, i) => (
                        <div key={i} style={{
                          display: 'inline-block', margin: 4, padding: '6px 12px',
                          background: '#f3f4f6', borderRadius: 6, fontSize: 13,
                        }}>
                          {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
