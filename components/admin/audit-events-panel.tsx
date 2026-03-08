'use client';

import { useMemo, useState } from 'react';
import { AuditEvent } from '@/types/research';

type AuditEventsPanelProps = {
  events: AuditEvent[];
};

export default function AuditEventsPanel({ events }: AuditEventsPanelProps) {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [entityType, setEntityType] = useState('all');

  const entityTypes = useMemo(() => {
    const values = new Set<string>();
    for (const event of events) {
      values.add(event.entity_type);
    }
    return ['all', ...Array.from(values).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      if (severity !== 'all' && event.severity !== severity) return false;
      if (entityType !== 'all' && event.entity_type !== entityType) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        event.action,
        event.entity_type,
        event.entity_id || '',
        event.actor_user_id || '',
        JSON.stringify(event.metadata || {}),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [entityType, events, query, severity]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action, actor, entity id, or metadata..."
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
        />
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value as 'all' | 'info' | 'warning' | 'critical')}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
        >
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
        >
          {entityTypes.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All entity types' : value}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filteredEvents.length} of {events.length} events.
      </p>

      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No events match your filters.</p>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{event.action}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${
                    event.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : event.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {event.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {event.entity_type} {event.entity_id ? `#${event.entity_id}` : ''} | Actor: {event.actor_user_id || 'system'}
              </p>
              <p className="mt-1 text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
