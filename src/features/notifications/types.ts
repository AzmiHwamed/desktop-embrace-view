export type NotificationTone = "success" | "brand" | "warning" | "muted";

export type ApiNotificationSource = "manual" | "event";

// Raw shape of a single notification, as returned inside ApiResponse<T>.data
export type ApiNotification = {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  pushSent: boolean;
  source: ApiNotificationSource;
  createdAt: string;
  updatedAt: string;
};

// Shape the UI renders — derived from ApiNotification, not stored as-is.
export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: NotificationTone;
  unread: boolean;
};

export type NotificationsState = {
  items: AppNotification[];

  loading: boolean;
  error: string | null;

  // True once the initial notifications fetch has settled (fulfilled OR
  // rejected) at least once — gates the page skeleton, same pattern as
  // ConvertState.currenciesLoaded. Kept separate from `loading`, which is
  // shared across fetchNotifications/markRead/markAllRead and toggles on
  // every request.
  notificationsLoaded: boolean;

  markAllPending: boolean;
};