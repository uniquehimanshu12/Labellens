import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Clock, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'review' | 'success' | 'warning' | 'info';
  route?: string;
  inspectionId?: string;
  read: boolean;
}

interface NotificationCenterProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate notifications based on real stored inspections
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const list = storageService.getInspections();
    const items: NotificationItem[] = [];

    const issues = list.filter((i) => i.status.includes('REQUIRES') || i.status.includes('ISSUE'));
    if (issues.length > 0) {
      items.push({
        id: 'notif_review',
        title: 'Inspector Review Required',
        message: `${issues.length} package inspections require manual evidence verification or signoff.`,
        timestamp: 'Just now',
        type: 'review',
        route: 'review-queue',
        read: false,
      });
    }

    const draft = storageService.getActiveDraft();
    if (draft) {
      items.push({
        id: 'notif_draft',
        title: 'Active Draft Autosaved',
        message: `Session ${draft.id} (${draft.productName || 'Unsaved Commodity'}) preserved locally.`,
        timestamp: '5m ago',
        type: 'info',
        route: 'active-inspection',
        read: false,
      });
    }

    if (list[0]) {
      items.push({
        id: 'notif_recent',
        title: 'Inspection Dossier Finalized',
        message: `Form-1 audit completed for ${list[0].productName} (${list[0].id}).`,
        timestamp: '2h ago',
        type: 'success',
        route: 'inspection-detail',
        inspectionId: list[0].id,
        read: true,
      });
    }

    items.push({
      id: 'notif_rules',
      title: 'Legal Metrology Rules Engine Active',
      message: 'Standard statutory rule definitions (LM-001 - LM-005) synchronized.',
      timestamp: 'Today',
      type: 'info',
      route: 'rules-references',
      read: true,
    });

    return items;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (item.route) {
      onNavigate(item.route, item.inspectionId ? { inspectionId: item.inspectionId } : undefined);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        id="btn-notification-bell"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C1630] transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          id="notification-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#140F24] border border-[#2D234C] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-slate-100"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[#2D234C] bg-[#1C1630]/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-violet-900 text-violet-200 font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#2D234C]/60 text-xs">
            {notifications.map((item) => {
              const iconMap = {
                review: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
                success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
                warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
                info: <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />,
              };

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    item.read
                      ? 'hover:bg-[#1C1630]/50 opacity-75'
                      : 'bg-[#1C1630]/80 hover:bg-[#221B3A] opacity-100'
                  }`}
                >
                  <div className="mt-0.5">{iconMap[item.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-bold text-white leading-tight truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {item.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[#2D234C] bg-[#0D0917] text-center text-[11px] text-slate-400">
            <span>Official Field Officer Log Channel</span>
          </div>
        </div>
      )}
    </div>
  );
};
