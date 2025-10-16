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
  role: varchar("role", { enum: ['admin', 'sales_consultant', 'trainer', 'student'] }).notNull().default('student'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
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
  fileUrl: varchar("file_url", { length: 500 }),
  status: varchar("status", { enum: ['pending', 'submitted', 'approved', 'needs_revision'] }).notNull().default('pending'),
  trainerComment: text("trainer_comment"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly schedules
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").references(() => users.id, { onDelete: 'cascade' }),
  trainerId: varchar("trainer_id").references(() => users.id, { onDelete: 'cascade' }),
  weekStart: timestamp("week_start").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  timeSlot: varchar("time_slot", { length: 50 }).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
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
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Material assignments to students
export const materialAssignments = pgTable("material_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").notNull().references(() => classMaterials.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

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
