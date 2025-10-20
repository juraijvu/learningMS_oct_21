// From javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  courses,
  modules,
  enrollments,
  trainerAssignments,
  moduleProgress,
  tasks,
  schedules,
  queries,
  relatedCourses,
  classMaterials,
  materialAssignments,
  activityLogs,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Module,
  type InsertModule,
  type Enrollment,
  type InsertEnrollment,
  type TrainerAssignment,
  type InsertTrainerAssignment,
  type ModuleProgress,
  type InsertModuleProgress,
  type Task,
  type InsertTask,
  type Schedule,
  type InsertSchedule,
  type Query,
  type InsertQuery,
  type ClassMaterial,
  type InsertClassMaterial,
  type MaterialAssignment,
  type InsertMaterialAssignment,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Module operations
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  
  // Enrollment operations
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Trainer assignment operations
  getTrainerAssignments(trainerId: string): Promise<TrainerAssignment[]>;
  createTrainerAssignment(assignment: InsertTrainerAssignment): Promise<TrainerAssignment>;
  
  // Module progress operations
  getStudentProgress(studentId: string): Promise<ModuleProgress[]>;
  updateModuleProgress(progress: InsertModuleProgress): Promise<ModuleProgress>;
  
  // Task operations
  getTasksByStudent(studentId: string): Promise<Task[]>;
  getTasksByTrainer(trainerId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  
  // Schedule operations
  getSchedulesByStudent(studentId: string): Promise<Schedule[]>;
  getSchedulesByTrainer(trainerId: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  
  // Query operations
  getQueriesByStudent(studentId: string): Promise<Query[]>;
  createQuery(query: InsertQuery): Promise<Query>;
  updateQuery(id: string, updates: Partial<Query>): Promise<Query>;
  
  // Class materials operations
  getClassMaterialsByCourse(courseId: string): Promise<ClassMaterial[]>;
  getClassMaterialsByTrainer(trainerId: string): Promise<ClassMaterial[]>;
  getClassMaterialById(id: string): Promise<ClassMaterial | undefined>;
  createClassMaterial(material: InsertClassMaterial): Promise<ClassMaterial>;
  deleteClassMaterial(id: string): Promise<void>;
  deleteExpiredMaterials(): Promise<number>;
  
  // Material assignment operations
  assignMaterialToStudent(materialId: string, studentId: string): Promise<MaterialAssignment>;
  getStudentMaterials(studentId: string): Promise<ClassMaterial[]>;
  getMaterialAssignments(materialId: string): Promise<MaterialAssignment[]>;
  
  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByAction(action: string, limit?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Course operations
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(courseData)
      .returning();
    return course;
  }

  // Module operations
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    const [module] = await db
      .insert(modules)
      .values(moduleData)
      .returning();
    return module;
  }

  // Enrollment operations
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async createEnrollment(enrollmentData: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values(enrollmentData)
      .returning();
    return enrollment;
  }

  // Trainer assignment operations
  async getTrainerAssignments(trainerId: string): Promise<TrainerAssignment[]> {
    return await db
      .select()
      .from(trainerAssignments)
      .where(eq(trainerAssignments.trainerId, trainerId))
      .orderBy(desc(trainerAssignments.assignedAt));
  }

  async createTrainerAssignment(assignmentData: InsertTrainerAssignment): Promise<TrainerAssignment> {
    const [assignment] = await db
      .insert(trainerAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  // Module progress operations
  async getStudentProgress(studentId: string): Promise<ModuleProgress[]> {
    return await db
      .select()
      .from(moduleProgress)
      .where(eq(moduleProgress.studentId, studentId));
  }

  async updateModuleProgress(progressData: InsertModuleProgress): Promise<ModuleProgress> {
    const existing = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.studentId, progressData.studentId),
          eq(moduleProgress.moduleId, progressData.moduleId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(moduleProgress)
        .set({
          isCompleted: progressData.isCompleted,
          completedBy: progressData.completedBy,
          completedAt: progressData.isCompleted ? new Date() : null,
        })
        .where(eq(moduleProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(moduleProgress)
        .values({
          ...progressData,
          completedAt: progressData.isCompleted ? new Date() : null,
        })
        .returning();
      return created;
    }
  }

  // Task operations
  async getTasksByStudent(studentId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.studentId, studentId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByTrainer(trainerId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedBy, trainerId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Schedule operations
  async getSchedulesByStudent(studentId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.studentId, studentId))
      .orderBy(schedules.dayOfWeek);
  }

  async getSchedulesByTrainer(trainerId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.trainerId, trainerId))
      .orderBy(schedules.dayOfWeek);
  }

  async createSchedule(scheduleData: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(scheduleData)
      .returning();
    return schedule;
  }

  // Query operations
  async getQueriesByStudent(studentId: string): Promise<Query[]> {
    return await db
      .select()
      .from(queries)
      .where(eq(queries.studentId, studentId))
      .orderBy(desc(queries.createdAt));
  }

  async createQuery(queryData: InsertQuery): Promise<Query> {
    const [query] = await db
      .insert(queries)
      .values(queryData)
      .returning();
    return query;
  }

  async updateQuery(id: string, updates: Partial<Query>): Promise<Query> {
    const [query] = await db
      .update(queries)
      .set(updates)
      .where(eq(queries.id, id))
      .returning();
    return query;
  }

  // Class materials operations
  async getClassMaterialsByCourse(courseId: string): Promise<ClassMaterial[]> {
    return await db
      .select()
      .from(classMaterials)
      .where(eq(classMaterials.courseId, courseId))
      .orderBy(desc(classMaterials.uploadedAt));
  }

  async getClassMaterialById(id: string): Promise<ClassMaterial | undefined> {
    const [material] = await db
      .select()
      .from(classMaterials)
      .where(eq(classMaterials.id, id));
    return material;
  }

  async createClassMaterial(materialData: InsertClassMaterial): Promise<ClassMaterial> {
    const [material] = await db
      .insert(classMaterials)
      .values(materialData)
      .returning();
    return material;
  }

  async deleteClassMaterial(id: string): Promise<void> {
    await db
      .delete(classMaterials)
      .where(eq(classMaterials.id, id));
  }

  async deleteExpiredMaterials(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(classMaterials)
      .where(sql`${classMaterials.expiresAt} < ${now}`)
      .returning();
    return result.length;
  }

  async getClassMaterialsByTrainer(trainerId: string): Promise<ClassMaterial[]> {
    return await db
      .select()
      .from(classMaterials)
      .where(eq(classMaterials.trainerId, trainerId))
      .orderBy(desc(classMaterials.uploadedAt));
  }

  // Material assignment operations
  async assignMaterialToStudent(materialId: string, studentId: string): Promise<MaterialAssignment> {
    const [assignment] = await db
      .insert(materialAssignments)
      .values({ materialId, studentId })
      .returning();
    return assignment;
  }

  async getStudentMaterials(studentId: string): Promise<ClassMaterial[]> {
    const assignments = await db
      .select()
      .from(materialAssignments)
      .where(eq(materialAssignments.studentId, studentId));
    
    if (assignments.length === 0) return [];
    
    const materialIds = assignments.map(a => a.materialId);
    return await db
      .select()
      .from(classMaterials)
      .where(sql`${classMaterials.id} = ANY(${materialIds})`)
      .orderBy(desc(classMaterials.uploadedAt));
  }

  async getMaterialAssignments(materialId: string): Promise<MaterialAssignment[]> {
    return await db
      .select()
      .from(materialAssignments)
      .where(eq(materialAssignments.materialId, materialId));
  }

  // Activity log operations
  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAllActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByUser(userId: string, limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByAction(action: string, limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, action))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
