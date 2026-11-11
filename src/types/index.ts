export interface Profile {
  id?: string;
  name: string;
  professionalTitle: string;
  shortIntroduction: string;
  biography: string;
  location: string;
  email: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  availability: string;
  availabilityMessage?: string;
  yearsOfExperience: string;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  updatedAt?: string;
}

export type ArchitectureTierType =
  | "client"
  | "gateway"
  | "auth"
  | "service"
  | "database"
  | "storage"
  | "queue"
  | "external";

export interface ArchitectureNode {
  id: string;
  tier: ArchitectureTierType;
  title: string;
  role: string;
  technologies: string[];
  flowDescription: string;
  targetNodeIds?: string[];
  level?: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category:
    | "Full-Stack"
    | "Full-Stack Development"
    | "Frontend"
    | "Backend"
    | "Web Application"
    | "System"
    | "UI/UX"
    | "Mobile"
    | "Other"
    | (string & {});
  status:
    | "Planning"
    | "In Development"
    | "Completed"
    | "Maintenance"
    | "Archived"
    | (string & {});
  featured: boolean;
  thumbnail?: string;
  heroImage?: string;
  gallery?: string[];
  technologies: string[];
  features: string[];
  problem?: string;
  solution?: string;
  developmentProcess?: string;
  architecture?: string;
  architectureNodes?: ArchitectureNode[];
  challenges?: string;
  results?: string;
  role?: string;
  duration?: string;
  client?: string;
  liveUrl?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  startDate?: string;
  endDate?: string;
  order: number;
  displayOrder?: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  id: string;
  name: string;
  category:
    | "Frontend"
    | "Backend"
    | "Database"
    | "DevOps"
    | "Design"
    | "Tools"
    | "Other"
    | (string & {});
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert" | (string & {});
  years: string;
  icon?: string;
  description?: string;
  featured: boolean;
  order?: number;
  displayOrder?: number;
}

export interface Experience {
  id: string;
  position: string;
  organization: string;
  location: string;
  employmentType:
    | "Full-Time"
    | "Part-Time"
    | "Freelance"
    | "Contract"
    | "Internship"
    | "Personal"
    | (string & {});
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements?: string[];
  technologies?: string[];
  order: number;
  displayOrder?: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string;
  achievements?: string[];
  order: number;
  displayOrder?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  credentialId?: string;
  issueDate: string;
  expirationDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
  certificateImage?: string;
  description: string;
  order?: number;
  displayOrder?: number;
}

export interface Service {
  id: string;
  title: string;
  slug?: string;
  description: string;
  icon?: string;
  features: string[];
  featured?: boolean;
  order?: number;
  displayOrder?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: string;
  status?: "Draft" | "Published" | "Archived";
  featured: boolean;
  date?: string;
  publishedAt?: string;
  readingTime: string;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
  isPublished?: boolean;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  username?: string;
  icon?: string;
  enabled?: boolean;
  order?: number;
  displayOrder?: number;
  isVisible?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  position: string;
  organization: string;
  message: string;
  photo?: string;
  rating: number;
  featured: boolean;
  approved: boolean;
  order: number;
  createdAt?: string;
  authorName?: string;
  authorTitle?: string;
  content?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  projectType:
    | "Website"
    | "Web Application"
    | "Full-Stack System"
    | "UI/UX"
    | "Consultation"
    | "Other";
  budget?: string;
  message: string;
  attachment?: string;
  status: "New" | "Read" | "Replied" | "Completed" | "Archived" | "Spam";
  createdAt: string;
  scheduledSlot?: string; // Proposed meeting ISO timestamp or formatted string
  meetLink?: string; // Google Meet video call URL
  agenda?: string; // Full structured meeting agenda
  calendarEventTitle?: string; // Plotted Google Calendar event title
  calendarEventId?: string; // Google Calendar Event ID or link
  replySentAt?: string; // Timestamp when automated response was dispatched
  replyNotes?: string; // Copy of reply body / invitation sent to client
  meetingOutcome?:
    | "Project Agreed"
    | "Proposal Sent"
    | "Follow-up Needed"
    | "Consultation Closed"
    | "Reschedule Requested"
    | "No-Show";
  meetingNotes?: string; // Logged notes, decisions, and agreements from the discovery call
  completedAt?: string; // Timestamp when call was marked completed
  followUpDate?: string; // Optional target date for subsequent follow-up
  convertedProjectId?: string; // ID of project created from this inquiry
}
export type ContactMessage = Message;

export interface SchedulingAvailability {
  startHour: number; // E.g., 9 (09:00)
  startMinute: number; // E.g., 0
  endHour: number; // E.g., 17 (17:00)
  endMinute: number; // E.g., 0
  slotDurationMinutes: number; // E.g., 30, 45, or 60
  bufferMinutes: number; // E.g., 15
  workDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  timezone?: string;
  defaultMeetUrl?: string; // Optional default personal Google Meet room URL
  maxMeetingsPerDay?: number; // Daily meeting limit before marking date full (default: 2)
}

export interface BatchReplyItem {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  projectType?: string;
  budget?: string;
  originalMessage: string;
  scheduledSlot: Date; // The calculated or manually overridden meeting Date
  meetLink?: string; // Google Meet URL generated for this meeting
  agenda?: string; // Structured meeting agenda
  calendarEventTitle?: string; // Event title plotted on Google Calendar
  customSubject?: string;
  customBodyHtml?: string;
}

export interface BatchScheduleResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ messageId: string; error: string }>;
}

export interface Resume {
  id: string;
  title: string;
  fileUrl: string;
  storagePath?: string;
  version: string;
  active?: boolean;
  summary?: string;
  notes?: string;
  filename?: string;
  downloadCount: number;
  uploadedAt: string;
  fileSize?: string;
  isDefault?: boolean;
}
export type ResumeDocument = Resume;

export interface Media {
  id: string;
  filename: string;
  fileName?: string;
  url: string;
  downloadUrl?: string;
  storagePath: string;
  type: string;
  mimeType: string;
  size: number;
  altText?: string;
  category?: string;
  uploadedBy?: string;
  provider?: "cloudinary" | "firebase";
  cloudinaryPublicId?: string;
  width?: number;
  height?: number;
  format?: string;
  createdAt: string;
}
export type MediaAsset = Media;

export interface SiteSettings {
  id?: string;
  siteName: string;
  siteTitle?: string;
  siteDescription: string;
  favicon?: string;
  logo?: string;
  defaultOgImage?: string;
  primaryEmail: string;
  contactEmail?: string;
  phone?: string;
  location: string;
  timezone?: string;
  copyrightText: string;
  googleAnalyticsId?: string;
  primaryColor?: string;
  brandColor?: string;
  enableContactForm?: boolean;
  enableBlogComments?: boolean;
  enableHireMeBanner?: boolean;
  metaKeywords?: string;
  analyticsId?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  googleSheetWebhookUrl?: string;
  notificationEmail?: string;
  defaultMeetUrl?: string;
  maxMeetingsPerDay?: number;
  maintenanceMode: boolean;
  showBlog: boolean;
  showServices: boolean;
  showTestimonials: boolean;
  showAnalytics: boolean;
}

export interface AnalyticsEvent {
  id?: string;
  type:
    | "page_view"
    | "project_view"
    | "blog_view"
    | "resume_download"
    | "contact_submission";
  targetId?: string;
  path: string;
  referrer?: string;
  deviceType?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  timestamp?: string;
  entityType?: string;
  details?: string;
  createdAt?: any;
  metadata?: Record<string, unknown>;
}
