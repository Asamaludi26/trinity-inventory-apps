import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Clock,
  ArrowRightCircle,
  Filter,
} from 'lucide-react';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  INFO: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  WARNING: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
  APPROVAL_REQUIRED: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  STATUS_CHANGE: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  REMINDER: 'text-violet-500 bg-violet-50 dark:bg-violet-950',
};

const TYPE_LABELS: Record<NotificationType, string> = {
  INFO: 'Informasi',
  WARNING: 'Peringatan',
  APPROVAL_REQUIRED: 'Persetujuan',
  STATUS_CHANGE: 'Perubahan Status',
  REMINDER: 'Pengingat',
};

function NotificationCard({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: number) => void;
}) {
  const navigate = useNavigate();
  const Icon = TYPE_ICONS[notification.type] ?? Info;
  const colorClass = TYPE_COLORS[notification.type] ?? 'text-muted-foreground bg-muted';

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${!notification.isRead ? 'border-primary/30 bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'}`}
            >
              {notification.title}
            </p>
            {!notification.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {TYPE_LABELS[notification.type] ?? notification.type}
            </Badge>
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: localeId,
              })}
            </span>
            <span className="hidden sm:inline">
              ({format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: localeId })}
              )
            </span>
          </div>
        </div>
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            aria-label="Tandai dibaca"
          >
            <Check className="size-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationListPage() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');

  const { data: notificationsData, isLoading } = useNotifications({
    page,
    limit: 20,
  });
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.data ?? [];
  const meta = notificationsData?.meta;

  const filteredNotifications =
    filterType === 'all'
      ? notifications
      : filterType === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.type === filterType);

  return (
    <PageContainer
      title="Notifikasi"
      description={unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
      actions={
        unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 size-4" />
            Tandai Semua Dibaca
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter notifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="unread">Belum Dibaca</SelectItem>
            <SelectItem value="APPROVAL_REQUIRED">Persetujuan</SelectItem>
            <SelectItem value="STATUS_CHANGE">Perubahan Status</SelectItem>
            <SelectItem value="WARNING">Peringatan</SelectItem>
            <SelectItem value="REMINDER">Pengingat</SelectItem>
            <SelectItem value="INFO">Informasi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Memuat notifikasi...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell className="mb-4 size-12" />
          <p className="text-lg font-medium">Tidak ada notifikasi</p>
          <p className="text-sm">
            {filterType !== 'all'
              ? 'Coba ubah filter untuk melihat notifikasi lainnya.'
              : 'Anda akan menerima notifikasi ketika ada aktivitas baru.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={(id) => markAsRead.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </PageContainer>
  );
}

export default NotificationListPage;

export const Component = NotificationListPage;
