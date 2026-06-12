export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin?: boolean;
  status: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Document {
  id: string;
  title: string;
  category: string;
  type: string;
  tags: string[];
  author: string;
  description: string;
  content: string;
  version: string;
  views: number;
  downloads: number;
  favorites: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  status: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string;
  status?: string;
  replies?: {
    id: string;
    commentId: string;
    author: string;
    content: string;
    likes: number;
    createdAt: string;
  }[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalDocuments: number;
  totalTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  userGrowth: { date: string; count: number }[];
  postActivity: { date: string; count: number }[];
  documentStats: { category: string; count: number }[];
  ticketStats: { status: string; count: number }[];
}

export interface SystemSettings {
  id: string;
  organizationName: string;
  siteName: string;
  siteDescription: string;
  defaultLanguage: string;
  timezone: string;
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    enableNotifications: boolean;
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
