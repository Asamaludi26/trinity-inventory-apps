import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Clock,
  ArrowRightCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/features/notifications';
import type { Notification, NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  APPROVAL_REQUIRED: Clock,
  STATUS_CHANGE: ArrowRightCircle,
  REMINDER: Bell,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  INFO: 'text-blue-500',
  WARNING: 'text-amber-500',
  APPROVAL_REQUIRED: 'text-orange-500',
  STATUS_CHANGE: 'text-emerald-500',
  REMINDER: 'text-violet-500',
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: number) => void;
}) {
  const navigate = useNavigate();
  const Icon = TYPE_ICONS[notification.type] ?? Info;
  const iconColor = TYPE_COLORS[notification.type] ?? 'text-muted-foreground';

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer" onClick={handleClick}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 space-y-1 min-w-0">
        <p
          className={`text-sm leading-tight ${notification.isRead ? 'text-muted-foreground' : 'font-medium'}`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: localeId,
          })}
        </p>
      </div>
      {!notification.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
    </DropdownMenuItem>
  );
}

export function NotificationDropdown() {
  const { data: notificationsData } = useNotifications({ limit: 10 });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-normal text-primary hover:text-primary/80"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead.mutate();
              }}
            >
              <CheckCheck className="mr-1 size-3" />
              Tandai semua dibaca
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="mb-2 size-8" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={(id) => markAsRead.mutate(id)}
              />
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
