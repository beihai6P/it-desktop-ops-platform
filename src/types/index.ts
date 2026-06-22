export interface CaseStep {
  step: number;
  title: string;
  description: string;
  commands?: string[];
  expectedResult?: string;
}

export interface CaseImage {
  name: string;
  url: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  errorCode: string;
  deviceType: string;
  brand: string;
  model: string;
  systemVersion?: string;
  status: 'resolved' | 'pending' | 'in_progress';
  views: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorId: string;
  symptoms: string[];
  causeAnalysis: string;
  troubleshooting?: string;
  solution: string;
  steps: CaseStep[];
  relatedCases: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  verification: boolean;
  isEssence?: boolean;
  isPinned?: boolean;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  quality?: 'verified' | 'standard' | 'basic';
  visibility?: 'public' | 'internal' | 'private';
  attachments?: Attachment[];
  troubleshootingImages?: CaseImage[];
  causeAnalysisImages?: CaseImage[];
  solutionImages?: CaseImage[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// 案例分类
export type CaseCategory =
  | 'all'
  | 'system'
  | 'network'
  | 'hardware'
  | 'printer'
  | 'software'
  | 'application'
  | 'security'
  | 'data'
  | 'virtual'
  | 'domain';

// 排序规则
export type SortRule = 'latest' | 'views' | 'likes' | 'popular' | 'unresolved';

// 质量筛选
export type QualityFilter = 'all' | 'verified' | 'standard' | 'basic' | 'critical' | 'high' | 'medium' | 'low';

// 案例统计数据
export interface CaseStats {
  total: number;
  resolved: number;
  pending: number;
  inProgress: number;
  resolutionRate: number;
  totalPosts?: number;
  closedSolutions?: number;
  weeklyNew?: number;
}

// AI诊断相关类型
export interface DiagnosisSolution {
  id: string;
  title: string;
  steps: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number;
}

export interface DiagnosisAnalysis {
  confidence: number;
  primaryCause: string;
  secondaryCauses: string[];
  suggestedSolutions: DiagnosisSolution[];
  relatedCases: {
    id: string;
    title: string;
    matchScore: number;
    link: string;
  }[];
  precautions: string[];
}

export interface DiagnosisResult {
  diagnosisId: string;
  symptoms: string[];
  analysis: DiagnosisAnalysis;
  aiSuggestion: string;
}

export interface DiagnosisRequest {
  symptoms: string[];
  deviceType?: string;
  brand?: string;
  model?: string;
  errorCode?: string;
  additionalInfo?: string;
}

export interface Symptom {
  id: string;
  text: string;
  category: string;
  frequency: number;
}

// AI诊断历史记录
export interface DiagnosisHistory {
  id: string;
  symptoms: string[];
  timestamp: string;
  resultCount: number;
}

// 评论相关类型
export interface CaseComment {
  id: string;
  caseId: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
  replies: CaseReply[];
}

export interface CaseReply {
  id: string;
  commentId: string;
  author: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  commentId: string;
  author: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
}

// 草稿相关类型
export interface CaseDraft {
  id: string;
  title: string;
  category: CaseCategory;
  systemVersion: string;
  symptoms: string[];
  causeAnalysis: string;
  solution: string;
  steps: CaseStep[];
  tags: string[];
  visibility: 'public' | 'internal' | 'private';
  attachments: Attachment[];
  updatedAt: string;
}

// 案例模板
export interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  category: CaseCategory;
  symptoms: string[];
  steps: CaseStep[];
}

export interface Template {
  id: string;
  title: string;
  category: string;
  type: string;
  author: string;
  downloads: number;
  rating: number;
  updatedAt: string;
  tags: string[];
  status: 'verified' | 'draft';
}

export interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface Ticket {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  assignee: string;
  createdAt: string;
}

export interface FaultType {
  id: string;
  name: string;
  category: 'system' | 'network' | 'hardware' | 'software';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps?: {
    title: string;
    description: string;
    commands: string[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Experiment {
  id: string;
  name: string;
  faultType: string;
  faultTypeId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: {
    issues: string[];
    recommendations: string[];
  };
  logs?: {
    timestamp: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  title: string;
  participants: number;
  status: 'active' | 'pending' | 'ended';
  startTime: string;
  type: 'screen' | 'video' | 'chat';
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'viewer' | 'editor';
  status: 'online' | 'away';
}

export interface User {
  email: string;
  id: string;
  name: string;
  avatar?: string;
  role: string;
  posts: number;
  likes: number;
  followers: number;
  status: 'online' | 'offline' | 'away';
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
  replies: Reply[];
}

export interface Reply {
  id: string;
  commentId: string;
  author: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  status: 'hot' | 'new' | 'normal';
  category: string;
  views: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  reviewStatus: 'pending' | 'review' | 'approved' | 'rejected';
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ReviewStats {
  pending: number;
  review: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface ContentCheckResult {
  needsReview: boolean;
  keywords: string[];
  suggestedStatus: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface CommunityStats {
  todayPosts: number;
  activeUsers: number;
  totalPosts: number;
  totalUsers: number;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  type: string;
  views: number;
  downloads: number;
  favorites: number;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  author: string;
  authorId: string;
  description: string;
  content: string;
  isFavorite?: boolean;
  status: 'published' | 'draft';
  version: string;
}

export interface ToolComment {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  rating: number;
  createdAt: string;
  replies?: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
  }[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  downloads: number;
  views: number;
  stars: number;
  author: string;
  authorId: string;
  updatedAt: string;
  createdAt: string;
  type: 'script' | 'tool' | 'plugin';
  version: string;
  fileSize: string;
  downloadUrl: string;
  actualMimeType?: string;
  screenshots?: string[];
  license: string;
  compatibility: string[];
  comments: ToolComment[];
  isFeatured?: boolean;
  isVerified?: boolean;
  isPinned?: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  mentionNotifications: boolean;
  commentNotifications: boolean;
  systemAlertNotifications: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  twoFactorAuth: boolean;
  passwordExpirationDays: number;
  maxLoginAttempts: number;
  sessionTimeoutWarning: boolean;
  requireStrongPasswords: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
}

export interface DataRetentionSettings {
  logRetentionDays: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  autoCleanupEnabled: boolean;
  cleanupIntervalDays: number;
  maxStorageMB: number;
}

export interface IntegrationSettings {
  emailIntegration: boolean;
  slackIntegration: boolean;
  microsoftTeamsIntegration: boolean;
  apiAccessEnabled: boolean;
  webhookEnabled: boolean;
}

export interface AISettings {
  enabled: boolean;
  provider: 'doubao' | 'openai' | 'custom';
  apiKey: string;
  apiUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface SystemSettings {
  id: string;
  organizationName: string;
  organizationLogo?: string;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  dataRetention: DataRetentionSettings;
  integrations: IntegrationSettings;
  aiSettings: AISettings;
  updatedAt: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface GaugeData {
  value: number;
  max: number;
  min: number;
  label: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface TicketStats {
  total: number;
  resolved: number;
  pending: number;
  inProgress: number;
  resolutionRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export interface FaultDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
}

export interface PostStats {
  totalPosts: number;
  todayPosts: number;
  avgDailyPosts: number;
  hotPosts: number;
}

export interface TimeRange {
  label: string;
  value: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  todayPosts: number;
  resolutionRate: number;
  avgResponseTime: number;
  trendingTopics: string[];
  topContributors: User[];
}

export interface CategoryStats {
  name: string;
  count: number;
  growth: number;
  icon: string;
}

// AI诊断相关类型
export interface DiagnosisSolution {
  id: string;
  title: string;
  steps: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number;
}

export interface DiagnosisAnalysis {
  confidence: number;
  primaryCause: string;
  secondaryCauses: string[];
  suggestedSolutions: DiagnosisSolution[];
  relatedCases: {
    id: string;
    title: string;
    matchScore: number;
    link: string;
  }[];
  precautions: string[];
}

export interface DiagnosisResult {
  diagnosisId: string;
  symptoms: string[];
  analysis: DiagnosisAnalysis;
  aiSuggestion: string;
}

export interface DiagnosisRequest {
  symptoms: string[];
  deviceType?: string;
  brand?: string;
  model?: string;
  errorCode?: string;
  additionalInfo?: string;
}

export interface Symptom {
  id: string;
  text: string;
  category: string;
  frequency: number;
}

// 知识库AI相关类型
export interface QAResult {
  question: string;
  answer: string;
  confidence: number;
  sources: {
    documentId: string;
    title: string;
    category: string;
    relevance: number;
    snippet: string;
    link: string;
  }[];
}

export interface KnowledgeSearchResult {
  query: string;
  results: {
    documentId: string;
    title: string;
    category: string;
    type: string;
    relevance: number;
    views: number;
    downloads: number;
    summary: string;
    link: string;
  }[];
  relatedQueries: string[];
}

export interface DocumentSummary {
  documentId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedReadingTime: string;
}

// 沙盒实验AI分析相关类型
export interface ExperimentIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export interface ExperimentRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: string;
}

export interface ExperimentRootCause {
  primary: string;
  secondary: string[];
  confidence: number;
}

export interface ExperimentAnalysis {
  status: 'completed';
  rootCause: ExperimentRootCause;
  issues: ExperimentIssue[];
  recommendations: ExperimentRecommendation[];
  suggestedFix: string;
}

export interface ExperimentReport {
  summary: string;
  keyFindings: string[];
  improvementScore: number;
  recommendationsCount: number;
}

export interface ExperimentAnalysisResult {
  experimentId: string;
  faultType: string;
  analysis: ExperimentAnalysis;
  report: ExperimentReport;
}

export interface ExperimentComparisonResult {
  experiments: {
    id: string;
    name: string;
    date: string;
    result: string;
  }[];
  comparison: {
    metric: string;
    baseline: number;
    current: number;
    improvement: number;
    status: 'improved' | 'declined';
  };
  insights: string[];
}

export interface Notification {
  id: string;
  _id?: string;
  userId: string;
  type: 'system' | 'comment' | 'like' | 'mention' | 'task' | 'review' | 'ticket' | 'message';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationStats {
  count: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
