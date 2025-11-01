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
  attendance,
  enrollmentRequests,
  posts,
  postComments,
  postLikes,
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
  type Attendance,
  type InsertAttendance,
  type EnrollmentRequest,
  type InsertEnrollmentRequest,
  type Post,
  type InsertPost,
  type PostComment,
  type InsertPostComment,
  type PostLike,
  type InsertPostLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

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
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule>;
  
  // Query operations
  getQueriesByStudent(studentId: string): Promise<Query[]>;
  getQueriesByTrainer(trainerId: string): Promise<Query[]>;
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
  
  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  getAttendanceByTrainer(trainerId: string): Promise<Attendance[]>;
  getAttendanceBySchedule(scheduleId: string): Promise<Attendance[]>;
  verifyAttendance(id: string, trainerId: string, notes?: string): Promise<Attendance>;
  
  // Enrollment request operations
  createEnrollmentRequest(request: InsertEnrollmentRequest): Promise<EnrollmentRequest>;
  getAllEnrollmentRequests(): Promise<EnrollmentRequest[]>;
  getPendingEnrollmentRequests(): Promise<EnrollmentRequest[]>;
  getEnrollmentRequestsByStudent(studentId: string): Promise<EnrollmentRequest[]>;
  approveEnrollmentRequest(id: string, reviewerId: string, enrolledById: string): Promise<EnrollmentRequest>;
  rejectEnrollmentRequest(id: string, reviewerId: string, message?: string): Promise<EnrollmentRequest>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  getApprovedPosts(): Promise<Post[]>;
  getPendingPosts(): Promise<Post[]>;
  approvePost(id: string, approverId: string): Promise<Post>;
  rejectPost(id: string): Promise<Post>;
  
  // Comment operations
  createComment(comment: InsertPostComment): Promise<PostComment>;
  getCommentsByPost(postId: string): Promise<PostComment[]>;
  
  // Like operations
  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }>;
  getLikesByPost(postId: string): Promise<PostLike[]>;
  
  // Image cleanup
  deleteExpiredPostImages(): Promise<number>;
  
  // Profile operations
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
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
    try {
      console.log('[Storage] Updating module progress:', progressData);
      
      // Use a transaction to handle race conditions
      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(moduleProgress)
          .where(
            and(
              eq(moduleProgress.studentId, progressData.studentId),
              eq(moduleProgress.moduleId, progressData.moduleId)
            )
          );

        console.log('[Storage] Existing progress records found:', existing.length);

        if (existing.length > 0) {
          // Update existing progress
          console.log('[Storage] Updating existing progress record:', existing[0].id);
          const [updated] = await tx
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
          // Create new progress record
          console.log('[Storage] Creating new progress record');
          const [created] = await tx
            .insert(moduleProgress)
            .values({
              ...progressData,
              completedAt: progressData.isCompleted ? new Date() : null,
            })
            .returning();
          return created;
        }
      });
      
      console.log('[Storage] Module progress updated successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[Storage] Error updating module progress:', error);
      throw error;
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

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
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

  async getQueriesByTrainer(trainerId: string): Promise<Query[]> {
    // Get all queries from students enrolled in trainer's courses
    const trainerCourses = await db
      .select({ courseId: trainerAssignments.courseId })
      .from(trainerAssignments)
      .where(eq(trainerAssignments.trainerId, trainerId));
    
    if (trainerCourses.length === 0) return [];
    
    const courseIds = trainerCourses.map(tc => tc.courseId);
    
    // Get modules from trainer's courses
    const courseModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(inArray(modules.courseId, courseIds));
    
    if (courseModules.length === 0) return [];
    
    const moduleIds = courseModules.map(m => m.id);
    
    return await db
      .select()
      .from(queries)
      .where(inArray(queries.moduleId, moduleIds))
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
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(materialAssignments)
      .where(and(
        eq(materialAssignments.materialId, materialId),
        eq(materialAssignments.studentId, studentId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
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
      .where(inArray(classMaterials.id, materialIds))
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

  // Attendance operations
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [result] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return result;
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByTrainer(trainerId: string): Promise<Attendance[]> {
    const trainerSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.trainerId, trainerId));
    
    if (trainerSchedules.length === 0) return [];
    
    const scheduleIds = trainerSchedules.map(s => s.id);
    return await db
      .select()
      .from(attendance)
      .where(inArray(attendance.scheduleId, scheduleIds))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceBySchedule(scheduleId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.scheduleId, scheduleId))
      .orderBy(desc(attendance.date));
  }

  async verifyAttendance(id: string, trainerId: string, notes?: string): Promise<Attendance> {
    const [result] = await db
      .update(attendance)
      .set({
        verifiedBy: trainerId,
        verifiedAt: new Date(),
        notes: notes,
      })
      .where(eq(attendance.id, id))
      .returning();
    return result;
  }

  // Enrollment request operations
  async createEnrollmentRequest(requestData: InsertEnrollmentRequest): Promise<EnrollmentRequest> {
    const [request] = await db
      .insert(enrollmentRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getAllEnrollmentRequests(): Promise<EnrollmentRequest[]> {
    return await db
      .select()
      .from(enrollmentRequests)
      .orderBy(desc(enrollmentRequests.createdAt));
  }

  async getPendingEnrollmentRequests(): Promise<EnrollmentRequest[]> {
    return await db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.status, 'pending'))
      .orderBy(desc(enrollmentRequests.createdAt));
  }

  async getEnrollmentRequestsByStudent(studentId: string): Promise<EnrollmentRequest[]> {
    return await db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.studentId, studentId))
      .orderBy(desc(enrollmentRequests.createdAt));
  }

  async approveEnrollmentRequest(id: string, reviewerId: string, enrolledById: string): Promise<EnrollmentRequest> {
    const [request] = await db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.id, id));

    if (!request) {
      throw new Error('Enrollment request not found');
    }

    await db
      .insert(enrollments)
      .values({
        studentId: request.studentId,
        courseId: request.courseId,
        enrolledBy: enrolledById,
      });

    const [updated] = await db
      .update(enrollmentRequests)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(enrollmentRequests.id, id))
      .returning();

    return updated;
  }

  async rejectEnrollmentRequest(id: string, reviewerId: string, message?: string): Promise<EnrollmentRequest> {
    const [updated] = await db
      .update(enrollmentRequests)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        message: message,
      })
      .where(eq(enrollmentRequests.id, id))
      .returning();
    return updated;
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.category, category))
      .orderBy(desc(courses.createdAt));
  }

  // Post operations
  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async getAllPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
  }

  async getApprovedPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'approved'))
      .orderBy(desc(posts.createdAt));
  }

  async getPendingPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'pending'))
      .orderBy(desc(posts.createdAt));
  }

  async approvePost(id: string, approverId: string): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async rejectPost(id: string): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ status: 'rejected' })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  // Comment operations
  async createComment(commentData: InsertPostComment): Promise<PostComment> {
    const [comment] = await db
      .insert(postComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getCommentsByPost(postId: string): Promise<PostComment[]> {
    return await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
  }

  // Like operations
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    if (existingLike.length > 0) {
      // Unlike
      await db
        .delete(postLikes)
        .where(eq(postLikes.id, existingLike[0].id));
    } else {
      // Like
      await db
        .insert(postLikes)
        .values({ postId, userId });
    }
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
    
    return { liked: existingLike.length === 0, count: count || 0 };
  }

  async getLikesByPost(postId: string): Promise<PostLike[]> {
    return await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId));
  }

  // Image cleanup
  async deleteExpiredPostImages(): Promise<number> {
    const now = new Date();
    const expiredPosts = await db
      .select()
      .from(posts)
      .where(sql`${posts.imageExpiresAt} < ${now} AND ${posts.imageUrl} IS NOT NULL`);
    
    let deletedCount = 0;
    for (const post of expiredPosts) {
      if (post.imageUrl) {
        try {
          const filePath = path.join(process.cwd(), post.imageUrl);
          await fs.unlink(filePath).catch(() => {});
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete image for post ${post.id}:`, error);
        }
      }
    }
    
    // Clear imageUrl and imageExpiresAt for expired posts
    await db
      .update(posts)
      .set({ imageUrl: null, imageExpiresAt: null })
      .where(sql`${posts.imageExpiresAt} < ${now}`);
    
    return deletedCount;
  }

  // Profile operations
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
