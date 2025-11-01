import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth from javascript_log_in_with_replit blueprint)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  education: jsonb("education"), // Array of education objects
  workExperience: jsonb("work_experience"), // Array of work experience objects
  role: varchar("role", { enum: ['admin', 'sales_consultant', 'trainer', 'student'] }).notNull().default('student'),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastPasswordChange: timestamp("last_password_change"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  imageUrl: varchar("image_url", { length: 500 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course modules table
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  subPoints: text("sub_points").array().notNull().default(sql`ARRAY[]::text[]`),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledBy: varchar("enrolled_by").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// Trainer course assignments
export const trainerAssignments = pgTable("trainer_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Module progress tracking
export const moduleProgress = pgTable("module_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: 'cascade' }),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: varchar("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
});

// Tasks assigned to students
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  // Trainer uploaded files (task materials)
  trainerFileUrl: varchar("trainer_file_url", { length: 500 }),
  trainerFileName: varchar("trainer_file_name", { length: 255 }),
  // Student submission file
  fileUrl: varchar("file_url", { length: 500 }),
  status: varchar("status", { enum: ['pending', 'submitted', 'approved', 'needs_revision'] }).notNull().default('pending'),
  trainerComment: text("trainer_comment"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly schedules - backward compatible with existing schema
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").references(() => users.id, { onDelete: 'cascade' }),
  trainerId: varchar("trainer_id").references(() => users.id, { onDelete: 'cascade' }),
  weekStart: timestamp("week_start").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  timeSlot: varchar("time_slot", { length: 50 }).notNull(),
  status: varchar("status", { enum: ['active', 'paused', 'cancelled', 'completed'] }).notNull().default('active'),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student queries on modules
export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  query: text("query").notNull(),
  response: text("response"),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Related courses (many-to-many)
export const relatedCourses = pgTable("related_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  relatedCourseId: varchar("related_course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
});

// Class materials (notes and videos) shared by trainers
export const classMaterials = pgTable("class_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  trainerId: varchar("trainer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { enum: ['video', 'note'] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  allowDownload: boolean("allow_download").notNull().default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Material assignments to students
export const materialAssignments = pgTable("material_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").notNull().references(() => classMaterials.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => [
  index("idx_material_assignment_unique").on(table.materialId, table.studentId),
]);

// Enrollment requests from students
export const enrollmentRequests = pgTable("enrollment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  status: varchar("status", { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  message: text("message"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_enrollment_request_student").on(table.studentId),
  index("idx_enrollment_request_status").on(table.status),
]);

// Activity logs for tracking all user actions
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'login', 'logout', 'course_assigned', 'student_enrolled', 'material_uploaded', etc.
  entityType: varchar("entity_type", { length: 50 }), // e.g., 'course', 'user', 'material', 'task', etc.
  entityId: varchar("entity_id"), // ID of the affected entity
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: 'set null' }), // User affected by the action (e.g., student being enrolled)
  details: jsonb("details"), // Additional context as JSON
  ipAddress: varchar("ip_address", { length: 45 }), // Support both IPv4 and IPv6
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_user").on(table.userId),
  index("idx_activity_action").on(table.action),
  index("idx_activity_created").on(table.createdAt),
]);

// Attendance tracking for class sessions
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  status: varchar("status", { enum: ['present', 'absent', 'late'] }).notNull().default('present'),
  markedAt: timestamp("marked_at").defaultNow().notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
}, (table) => [
  index("idx_attendance_student").on(table.studentId),
  index("idx_attendance_schedule").on(table.scheduleId),
  index("idx_attendance_date").on(table.date),
]);

// Social media posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content"),
  imageUrl: varchar("image_url", { length: 500 }),
  imageExpiresAt: timestamp("image_expires_at"),
  status: varchar("status", { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_posts_author").on(table.authorId),
  index("idx_posts_status").on(table.status),
  index("idx_posts_created").on(table.createdAt),
]);

// Post comments
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comments_post").on(table.postId),
  index("idx_comments_author").on(table.authorId),
]);

// Post likes
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_likes_post").on(table.postId),
  index("idx_likes_user").on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  trainerAssignments: many(trainerAssignments),
  moduleProgress: many(moduleProgress),
  tasks: many(tasks),
  queries: many(queries),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  enrollments: many(enrollments),
  trainerAssignments: many(trainerAssignments),
  schedules: many(schedules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  progress: many(moduleProgress),
  tasks: many(tasks),
  queries: many(queries),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const trainerAssignmentsRelations = relations(trainerAssignments, ({ one }) => ({
  trainer: one(users, {
    fields: [trainerAssignments.trainerId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [trainerAssignments.courseId],
    references: [courses.id],
  }),
}));

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  student: one(users, {
    fields: [moduleProgress.studentId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [moduleProgress.moduleId],
    references: [modules.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  module: one(modules, {
    fields: [tasks.moduleId],
    references: [modules.id],
  }),
  student: one(users, {
    fields: [tasks.studentId],
    references: [users.id],
  }),
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  module: one(modules, {
    fields: [queries.moduleId],
    references: [modules.id],
  }),
  student: one(users, {
    fields: [queries.studentId],
    references: [users.id],
  }),
}));

export const classMaterialsRelations = relations(classMaterials, ({ one, many }) => ({
  course: one(courses, {
    fields: [classMaterials.courseId],
    references: [courses.id],
  }),
  trainer: one(users, {
    fields: [classMaterials.trainerId],
    references: [users.id],
  }),
  assignments: many(materialAssignments),
}));

export const materialAssignmentsRelations = relations(materialAssignments, ({ one }) => ({
  material: one(classMaterials, {
    fields: [materialAssignments.materialId],
    references: [classMaterials.id],
  }),
  student: one(users, {
    fields: [materialAssignments.studentId],
    references: [users.id],
  }),
}));

export const enrollmentRequestsRelations = relations(enrollmentRequests, ({ one }) => ({
  student: one(users, {
    fields: [enrollmentRequests.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollmentRequests.courseId],
    references: [courses.id],
  }),
  reviewer: one(users, {
    fields: [enrollmentRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [activityLogs.targetUserId],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  schedule: one(schedules, {
    fields: [attendance.scheduleId],
    references: [schedules.id],
  }),
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [attendance.verifiedBy],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [posts.approvedBy],
    references: [users.id],
  }),
  comments: many(postComments),
  likes: many(postLikes),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.authorId],
    references: [users.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type InsertModule = typeof modules.$inferInsert;
export type Module = typeof modules.$inferSelect;

export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertTrainerAssignment = typeof trainerAssignments.$inferInsert;
export type TrainerAssignment = typeof trainerAssignments.$inferSelect;

export type InsertModuleProgress = typeof moduleProgress.$inferInsert;
export type ModuleProgress = typeof moduleProgress.$inferSelect;

export type InsertTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;

export type InsertSchedule = typeof schedules.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;

export type InsertQuery = typeof queries.$inferInsert;
export type Query = typeof queries.$inferSelect;

export type InsertRelatedCourse = typeof relatedCourses.$inferInsert;
export type RelatedCourse = typeof relatedCourses.$inferSelect;

export type InsertClassMaterial = typeof classMaterials.$inferInsert;
export type ClassMaterial = typeof classMaterials.$inferSelect;

export type InsertMaterialAssignment = typeof materialAssignments.$inferInsert;
export type MaterialAssignment = typeof materialAssignments.$inferSelect;

export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertAttendance = typeof attendance.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;

export type InsertEnrollmentRequest = typeof enrollmentRequests.$inferInsert;
export type EnrollmentRequest = typeof enrollmentRequests.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertPostComment = typeof postComments.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;

export type InsertPostLike = typeof postLikes.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertTrainerAssignmentSchema = createInsertSchema(trainerAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertModuleProgressSchema = createInsertSchema(moduleProgress).omit({
  id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  weekStart: z.coerce.date(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Time slot must be in format HH:MM-HH:MM"),
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertClassMaterialSchema = createInsertSchema(classMaterials).omit({
  id: true,
  uploadedAt: true,
});

export const insertMaterialAssignmentSchema = createInsertSchema(materialAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
});

export const insertEnrollmentRequestSchema = createInsertSchema(enrollmentRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});
