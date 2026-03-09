"use client";

import { useEffect, useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
type TicketType = "BUG" | "FEATURE" | "QUESTION" | "OTHER";

interface SupportMessage {
  id: string;
  fromAdmin: boolean;
  body: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  type: TicketType;
  subject: string;
  body: string;
  screenshotUrl?: string | null;
  status: TicketStatus;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  messages: SupportMessage[];
}

type StatusFilter = "ALL" | TicketStatus;

export default function AdminSupportPage() {
  const { t } = useAdminI18n();
  const ts = t.support;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/support")
      .then((r) => r.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const openTicket = tickets.find((t) => t.id === openId);

  const filteredTickets = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter);

  const counts: Record<StatusFilter, number> = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const handleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
    setReplyBody("");
    setReplySuccess(false);
  };

  const handleReply = async () => {
    if (!openId || !replyBody.trim()) return;
    setReplying(true);
    setReplySuccess(false);
    const res = await fetch(`/api/admin/support/${openId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody }),
    });
    if (res.ok) {
      setReplyBody("");
      setReplySuccess(true);
      load();
    }
    setReplying(false);
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const typeLabel = (type: TicketType) => {
    const map: Record<TicketType, string> = {
      BUG: ts.typeBug,
      FEATURE: ts.typeFeature,
      QUESTION: ts.typeQuestion,
      OTHER: ts.typeOther,
    };
    return map[type];
  };

  const statusLabel = (status: TicketStatus) => {
    const map: Record<TicketStatus, string> = {
      OPEN: ts.statusOpen,
      IN_PROGRESS: ts.statusInProgress,
      CLOSED: ts.statusClosed,
    };
    return map[status];
  };

  const statusBadgeClass = (status: TicketStatus) => {
    if (status === "OPEN") return "bg-yellow-100 text-yellow-800";
    if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-600";
  };

  const typeBadgeClass = (type: TicketType) => {
    if (type === "BUG") return "bg-red-100 text-red-800";
    if (type === "FEATURE") return "bg-purple-100 text-purple-800";
    if (type === "QUESTION") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: ts.filterAll },
    { key: "OPEN", label: ts.filterOpen },
    { key: "IN_PROGRESS", label: ts.filterInProgress },
    { key: "CLOSED", label: ts.filterClosed },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{ts.title}</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === key
                ? "bg-[#4577ac] text-white border-[#4577ac]"
                : "bg-white text-gray-700 border-gray-300 hover:border-[#4577ac]"
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{t.loading}</p>
      ) : filteredTickets.length === 0 ? (
        <p className="text-gray-500">{ts.noTickets}</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colUser}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colType}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colSubject}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colStatus}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colDate}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{ts.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <>
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ticket.user.firstName} {ticket.user.lastName}</div>
                      <div className="text-xs text-gray-500">{ticket.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(ticket.type)}`}>
                        {typeLabel(ticket.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(ticket.status)}`}>
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpen(ticket.id)}
                        className="text-[#4577ac] hover:underline text-sm"
                      >
                        {openId === ticket.id ? "▲" : "▼"} {ts.open}
                      </button>
                    </td>
                  </tr>

                  {/* Inline detail panel */}
                  {openId === ticket.id && openTicket && (
                    <tr key={`${ticket.id}-detail`}>
                      <td colSpan={6} className="bg-gray-50 px-6 py-5 border-t border-gray-200">
                        {/* Ticket body */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {typeLabel(ticket.type)} — {ticket.subject}
                          </p>
                          <p className="text-gray-800 whitespace-pre-wrap bg-white rounded border border-gray-200 px-4 py-3 text-sm">
                            {ticket.body}
                          </p>
                          {ticket.screenshotUrl && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Screenshot</p>
                              <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={ticket.screenshotUrl}
                                  alt="Screenshot"
                                  className="max-w-full rounded border border-gray-200 shadow-sm hover:opacity-90 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Message thread */}
                        {openTicket.messages.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {openTicket.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.fromAdmin ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-lg rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                                    msg.fromAdmin
                                      ? "bg-[#4577ac] text-white"
                                      : "bg-white border border-gray-200 text-gray-800"
                                  }`}
                                >
                                  {msg.body}
                                  <div className={`text-xs mt-1 ${msg.fromAdmin ? "text-blue-200" : "text-gray-400"}`}>
                                    {new Date(msg.createdAt).toLocaleString("de-DE")}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply form */}
                        {ticket.status !== "CLOSED" && (
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                              {ts.replyLabel}
                            </label>
                            <textarea
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder={ts.replyPlaceholder}
                              rows={4}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac] resize-vertical"
                            />
                            {replySuccess && (
                              <p className="text-green-600 text-xs mt-1">{ts.messageSent}</p>
                            )}
                            <button
                              onClick={handleReply}
                              disabled={replying || !replyBody.trim()}
                              className="mt-2 rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors disabled:opacity-50"
                            >
                              {replying ? t.loading : ts.replyButton}
                            </button>
                          </div>
                        )}

                        {/* Status controls */}
                        <div className="flex gap-2 flex-wrap">
                          {ticket.status !== "CLOSED" && (
                            <button
                              onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {ts.closeTicket}
                            </button>
                          )}
                          {ticket.status === "CLOSED" && (
                            <button
                              onClick={() => handleStatusChange(ticket.id, "OPEN")}
                              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {ts.reopenTicket}
                            </button>
                          )}
                          {ticket.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleStatusChange(ticket.id, "OPEN")}
                              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {ts.reopenTicket}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
