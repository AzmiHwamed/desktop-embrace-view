export type NotificationTone = "success" | "brand" | "warning" | "muted";

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
};
