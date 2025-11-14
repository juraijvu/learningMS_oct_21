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
  trainerSharedFiles,
  trainerFileAssignments,
  projectAssignments,
  projectSubmissions,
  certificateRequests,
  studentTrainerAssignments,
  sessionRecordings,
  sessionRecordingShares,
  notifications,
  moduleCompletionRequests,
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
  type TrainerSharedFile,
  type InsertTrainerSharedFile,
  type TrainerFileAssignment,
  type InsertTrainerFileAssignment,
  type ProjectAssignment,
  type InsertProjectAssignment,
  type ProjectSubmission,
  type InsertProjectSubmission,
  type CertificateRequest,
  type InsertCertificateRequest,
  type InsertStudentTrainerAssignment,
  type StudentTrainerAssignment,
  type SessionRecording,
  type InsertSessionRecording,
  type SessionRecordingShare,
  type InsertSessionRecordingShare,
  type Notification,
  type InsertNotification,
  type ModuleCompletionRequest,
  type InsertModuleCompletionRequest,
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
  updateCourse(id: string, updates: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  // Module operations
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, updates: Partial<Module>): Promise<Module>;
  deleteModule(id: string): Promise<void>;
  
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
  getMaterialAssignmentsWithStudents(materialId: string): Promise<any[]>;
  getClassMaterialsByTrainerWithAssignments(trainerId: string): Promise<any[]>;
  
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
  
  // Student progress operations
  getAllStudentProgress(): Promise<any[]>;
  getTrainerStudentProgress(trainerId: string): Promise<any[]>;
  verifyTrainerStudentAccess(trainerId: string, studentId: string): Promise<boolean>;
  
  // Trainer shared files operations
  createTrainerSharedFile(file: InsertTrainerSharedFile): Promise<TrainerSharedFile>;
  getTrainerSharedFilesByUploader(uploaderId: string): Promise<TrainerSharedFile[]>;
  getTrainerSharedFilesForTrainer(trainerId: string): Promise<TrainerSharedFile[]>;
  getTrainerSharedFileById(id: string): Promise<TrainerSharedFile | undefined>;
  deleteTrainerSharedFile(id: string): Promise<void>;
  deleteExpiredTrainerFiles(): Promise<number>;
  assignFileToTrainer(fileId: string, trainerId: string): Promise<TrainerFileAssignment>;
  getFileAssignments(fileId: string): Promise<TrainerFileAssignment[]>;
  
  // Project operations
  createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  getProjectAssignmentsByStudent(studentId: string): Promise<ProjectAssignment[]>;
  getProjectAssignmentsByTrainer(trainerId: string): Promise<ProjectAssignment[]>;
  submitProject(submission: InsertProjectSubmission): Promise<ProjectSubmission>;
  getProjectSubmission(assignmentId: string): Promise<ProjectSubmission | undefined>;
  reviewProjectSubmission(submissionId: string, status: 'approved' | 'rejected', grade?: string, comment?: string): Promise<ProjectSubmission>;
  checkCourseCompletion(studentId: string, courseId: string): Promise<boolean>;
  
  // Certificate operations
  createCertificateRequest(request: InsertCertificateRequest): Promise<CertificateRequest>;
  getCertificateRequestsByStudent(studentId: string): Promise<CertificateRequest[]>;
  getAllCertificateRequests(): Promise<CertificateRequest[]>;
  issueCertificate(requestId: string, issuedBy: string, certificateUrl: string): Promise<CertificateRequest>;
  rejectCertificateRequest(requestId: string): Promise<CertificateRequest>;
  
  // Student-Trainer assignment operations
  createStudentTrainerAssignment(assignment: InsertStudentTrainerAssignment): Promise<StudentTrainerAssignment>;
  getStudentTrainerAssignments(studentId?: string, trainerId?: string, courseId?: string): Promise<StudentTrainerAssignment[]>;
  deleteStudentTrainerAssignment(id: string): Promise<void>;
  getTrainerStudentsByCourse(trainerId: string, courseId: string): Promise<any[]>;
  getAllStudentTrainerAssignments(): Promise<any[]>;
  
  // Session recording operations
  createSessionRecording(recording: InsertSessionRecording): Promise<SessionRecording>;
  getSessionRecordingsByTrainer(trainerId: string): Promise<any[]>;
  getSessionRecordingById(id: string): Promise<SessionRecording | undefined>;
  shareRecordingWithStudents(recordingId: string, studentIds: string[]): Promise<void>;
  deleteSessionRecording(id: string): Promise<void>;
  getSharedRecordingsForStudent(studentId: string): Promise<any[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Module completion request operations
  createModuleCompletionRequest(request: InsertModuleCompletionRequest): Promise<ModuleCompletionRequest>;
  getModuleCompletionRequestsByStudent(studentId: string): Promise<any[]>;
  respondToCompletionRequest(requestId: string, status: 'completed' | 'dismissed'): Promise<ModuleCompletionRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
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

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db
      .delete(courses)
      .where(eq(courses.id, id));
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

  async updateModule(id: string, updates: Partial<Module>): Promise<Module> {
    // Get the current module to preserve the order if not explicitly updated
    const [currentModule] = await db.select().from(modules).where(eq(modules.id, id));
    if (!currentModule) {
      throw new Error('Module not found');
    }
    
    const [module] = await db
      .update(modules)
      .set({ 
        ...updates, 
        // Preserve the original order if not explicitly provided in updates
        order: updates.order !== undefined ? updates.order : currentModule.order,
        updatedAt: new Date() 
      })
      .where(eq(modules.id, id))
      .returning();
    return module;
  }

  async deleteModule(id: string): Promise<void> {
    await db
      .delete(modules)
      .where(eq(modules.id, id));
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
    console.log(`[Storage] Updating task ${id} with:`, updates);
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    console.log(`[Storage] Task updated successfully:`, task);
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

  async getClassMaterialsByTrainerWithAssignments(trainerId: string): Promise<any[]> {
    const materials = await db
      .select()
      .from(classMaterials)
      .where(eq(classMaterials.trainerId, trainerId))
      .orderBy(desc(classMaterials.uploadedAt));

    const materialsWithAssignments = await Promise.all(
      materials.map(async (material) => {
        const assignments = await this.getMaterialAssignmentsWithStudents(material.id);
        return {
          ...material,
          assignedStudents: assignments,
        };
      })
    );

    return materialsWithAssignments;
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

  async getMaterialAssignmentsWithStudents(materialId: string): Promise<any[]> {
    return await db
      .select({
        id: materialAssignments.id,
        studentId: users.id,
        studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
        studentEmail: users.email,
        assignedAt: materialAssignments.assignedAt,
      })
      .from(materialAssignments)
      .innerJoin(users, eq(materialAssignments.studentId, users.id))
      .where(eq(materialAssignments.materialId, materialId))
      .orderBy(sql`COALESCE(${users.firstName}, ${users.username})`);
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
  
  // Trainer shared files operations
  async createTrainerSharedFile(fileData: InsertTrainerSharedFile): Promise<TrainerSharedFile> {
    const [file] = await db
      .insert(trainerSharedFiles)
      .values(fileData)
      .returning();
    return file;
  }

  async getTrainerSharedFilesByUploader(uploaderId: string): Promise<TrainerSharedFile[]> {
    return await db
      .select()
      .from(trainerSharedFiles)
      .where(eq(trainerSharedFiles.uploadedBy, uploaderId))
      .orderBy(desc(trainerSharedFiles.uploadedAt));
  }

  async getTrainerSharedFilesForTrainer(trainerId: string): Promise<TrainerSharedFile[]> {
    const assignments = await db
      .select()
      .from(trainerFileAssignments)
      .where(eq(trainerFileAssignments.trainerId, trainerId));
    
    if (assignments.length === 0) return [];
    
    const fileIds = assignments.map(a => a.fileId);
    return await db
      .select()
      .from(trainerSharedFiles)
      .where(inArray(trainerSharedFiles.id, fileIds))
      .orderBy(desc(trainerSharedFiles.uploadedAt));
  }

  async getTrainerSharedFileById(id: string): Promise<TrainerSharedFile | undefined> {
    const [file] = await db
      .select()
      .from(trainerSharedFiles)
      .where(eq(trainerSharedFiles.id, id));
    return file;
  }

  async deleteTrainerSharedFile(id: string): Promise<void> {
    await db
      .delete(trainerSharedFiles)
      .where(eq(trainerSharedFiles.id, id));
  }

  async deleteExpiredTrainerFiles(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(trainerSharedFiles)
      .where(sql`${trainerSharedFiles.expiresAt} < ${now}`)
      .returning();
    return result.length;
  }

  async assignFileToTrainer(fileId: string, trainerId: string): Promise<TrainerFileAssignment> {
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(trainerFileAssignments)
      .where(and(
        eq(trainerFileAssignments.fileId, fileId),
        eq(trainerFileAssignments.trainerId, trainerId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [assignment] = await db
      .insert(trainerFileAssignments)
      .values({ fileId, trainerId })
      .returning();
    return assignment;
  }

  async getFileAssignments(fileId: string): Promise<TrainerFileAssignment[]> {
    return await db
      .select()
      .from(trainerFileAssignments)
      .where(eq(trainerFileAssignments.fileId, fileId));
  }

  // Student progress operations
  async getAllStudentProgress(): Promise<any[]> {
    const result = await db
      .select({
        studentId: users.id,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        studentEmail: users.email,
        studentPhone: users.phoneNumber,
        studentProfileImage: users.profileImageUrl,
        courseId: courses.id,
        courseTitle: courses.title,
        moduleId: modules.id,
        moduleTitle: modules.title,
        moduleOrder: modules.order,
        moduleSubPoints: modules.subPoints,
        isCompleted: sql<boolean>`CASE WHEN ${moduleProgress.isCompleted} IS NULL THEN false ELSE ${moduleProgress.isCompleted} END`,
        completedAt: moduleProgress.completedAt,
        moduleCreatedAt: modules.createdAt,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(modules, eq(courses.id, modules.courseId))
      .leftJoin(moduleProgress, and(
        eq(moduleProgress.studentId, users.id),
        eq(moduleProgress.moduleId, modules.id)
      ))
      .orderBy(users.firstName, courses.title, sql`COALESCE(${modules.order}, 0)`, modules.createdAt);

    // Group by student and course
    const grouped = result.reduce((acc, row) => {
      const key = `${row.studentId}-${row.courseId}`;
      if (!acc[key]) {
        acc[key] = {
          studentId: row.studentId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          studentPhone: row.studentPhone,
          studentProfileImage: row.studentProfileImage,
          courseId: row.courseId,
          courseTitle: row.courseTitle,
          modules: [],
          totalModules: 0,
          completedModules: 0,
        };
      }
      
      acc[key].modules.push({
        id: row.moduleId,
        title: row.moduleTitle,
        order: row.moduleOrder,
        subPoints: row.moduleSubPoints,
        isCompleted: row.isCompleted,
        completedAt: row.completedAt,
        createdAt: row.moduleCreatedAt,
      });
      
      acc[key].totalModules++;
      if (row.isCompleted) {
        acc[key].completedModules++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(item => ({
      ...item,
      modules: item.modules.sort((a, b) => {
        // First sort by order if both have valid orders
        if (a.order && b.order) {
          return a.order - b.order;
        }
        // If one has order and other doesn't, prioritize the one with order
        if (a.order && !b.order) return -1;
        if (!a.order && b.order) return 1;
        // If neither has order, sort by creation date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
      progressPercentage: item.totalModules > 0 ? Math.round((item.completedModules / item.totalModules) * 100) : 0,
    }));
  }

  async getTrainerStudentProgress(trainerId: string): Promise<any[]> {
    try {
      console.log('Getting trainer student progress for trainer:', trainerId);
      
      // First check if there are any assignments for this trainer
      const assignments = await db
        .select()
        .from(studentTrainerAssignments)
        .where(eq(studentTrainerAssignments.trainerId, trainerId));
      
      console.log(`Found ${assignments.length} assignments for trainer ${trainerId}:`, assignments);
      
      if (assignments.length === 0) {
        console.log('No assignments found for trainer');
        return [];
      }
      
      // Check each join step by step
      const studentsCheck = await db
        .select({ studentId: users.id, studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})` })
        .from(studentTrainerAssignments)
        .innerJoin(users, eq(studentTrainerAssignments.studentId, users.id))
        .where(eq(studentTrainerAssignments.trainerId, trainerId));
      
      console.log(`Students found after user join: ${studentsCheck.length}`, studentsCheck);
      
      const coursesCheck = await db
        .select({ courseId: courses.id, courseTitle: courses.title })
        .from(studentTrainerAssignments)
        .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
        .where(eq(studentTrainerAssignments.trainerId, trainerId));
      
      console.log(`Courses found after course join: ${coursesCheck.length}`, coursesCheck);
      
      const modulesCheck = await db
        .select({ moduleId: modules.id, moduleTitle: modules.title, courseId: modules.courseId })
        .from(studentTrainerAssignments)
        .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
        .innerJoin(modules, eq(courses.id, modules.courseId))
        .where(eq(studentTrainerAssignments.trainerId, trainerId));
      
      console.log(`Modules found after module join: ${modulesCheck.length}`, modulesCheck);
      
      const result = await db
        .select({
          studentId: users.id,
          studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
          studentEmail: users.email,
          studentPhone: users.phoneNumber,
          studentProfileImage: users.profileImageUrl,
          courseId: courses.id,
          courseTitle: courses.title,
          moduleId: modules.id,
          moduleTitle: modules.title,
          moduleOrder: modules.order,
          moduleSubPoints: modules.subPoints,
          isCompleted: sql<boolean>`CASE WHEN ${moduleProgress.isCompleted} IS NULL THEN false ELSE ${moduleProgress.isCompleted} END`,
          completedAt: moduleProgress.completedAt,
          moduleCreatedAt: modules.createdAt,
        })
        .from(studentTrainerAssignments)
        .innerJoin(users, eq(studentTrainerAssignments.studentId, users.id))
        .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
        .leftJoin(modules, eq(courses.id, modules.courseId))
        .leftJoin(moduleProgress, and(
          eq(moduleProgress.studentId, users.id),
          eq(moduleProgress.moduleId, modules.id)
        ))
        .where(eq(studentTrainerAssignments.trainerId, trainerId))
        .orderBy(sql`COALESCE(${users.firstName}, ${users.username})`, courses.title, sql`COALESCE(${modules.order}, 0)`, modules.createdAt);

      console.log(`Found ${result.length} records for trainer ${trainerId}`);
      
      // If no results but we have assignments, create entries for students without modules
      if (result.length === 0 && assignments.length > 0) {
        const studentCourseData = await db
          .select({
            studentId: users.id,
            studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
            studentEmail: users.email,
            studentPhone: users.phoneNumber,
            studentProfileImage: users.profileImageUrl,
            courseId: courses.id,
            courseTitle: courses.title,
          })
          .from(studentTrainerAssignments)
          .innerJoin(users, eq(studentTrainerAssignments.studentId, users.id))
          .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
          .where(eq(studentTrainerAssignments.trainerId, trainerId));
        
        console.log(`Found ${studentCourseData.length} student-course pairs without modules`);
        
        return studentCourseData.map(item => ({
          studentId: item.studentId,
          studentName: item.studentName,
          studentEmail: item.studentEmail,
          studentPhone: item.studentPhone,
          studentProfileImage: item.studentProfileImage,
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          modules: [],
          totalModules: 0,
          completedModules: 0,
          progressPercentage: 0,
        }));
      }

      const grouped = result.reduce((acc, row) => {
        const key = `${row.studentId}-${row.courseId}`;
        if (!acc[key]) {
          acc[key] = {
            studentId: row.studentId,
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            studentPhone: row.studentPhone,
            studentProfileImage: row.studentProfileImage,
            courseId: row.courseId,
            courseTitle: row.courseTitle,
            modules: [],
            totalModules: 0,
            completedModules: 0,
          };
        }
        
        // Only add module if it exists
        if (row.moduleId) {
          acc[key].modules.push({
            id: row.moduleId,
            title: row.moduleTitle,
            order: row.moduleOrder,
            subPoints: row.moduleSubPoints,
            isCompleted: row.isCompleted,
            completedAt: row.completedAt,
            createdAt: row.moduleCreatedAt,
          });
          
          acc[key].totalModules++;
          if (row.isCompleted) {
            acc[key].completedModules++;
          }
        }
        
        return acc;
      }, {} as Record<string, any>);

      const finalResult = Object.values(grouped).map(item => ({
        ...item,
        modules: item.modules.sort((a, b) => {
          if (a.order && b.order) {
            return a.order - b.order;
          }
          if (a.order && !b.order) return -1;
          if (!a.order && b.order) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
        progressPercentage: item.totalModules > 0 ? Math.round((item.completedModules / item.totalModules) * 100) : 0,
      }));
      
      console.log(`Returning ${finalResult.length} student progress records`);
      return finalResult;
    } catch (error) {
      console.error('Error in getTrainerStudentProgress:', error);
      return [];
    }
  }

  async verifyTrainerStudentAccess(trainerId: string, studentId: string): Promise<boolean> {
    // Check if trainer has this student assigned through student-trainer assignments
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentTrainerAssignments)
      .where(and(
        eq(studentTrainerAssignments.trainerId, trainerId),
        eq(studentTrainerAssignments.studentId, studentId)
      ));
    
    return (result[0]?.count || 0) > 0;
  }

  // Project operations
  async createProjectAssignment(assignmentData: InsertProjectAssignment): Promise<ProjectAssignment> {
    const [assignment] = await db
      .insert(projectAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async getProjectAssignmentsByStudent(studentId: string): Promise<ProjectAssignment[]> {
    return await db
      .select()
      .from(projectAssignments)
      .where(eq(projectAssignments.studentId, studentId))
      .orderBy(desc(projectAssignments.assignedAt));
  }

  async getProjectAssignmentsByTrainer(trainerId: string): Promise<ProjectAssignment[]> {
    return await db
      .select()
      .from(projectAssignments)
      .where(eq(projectAssignments.trainerId, trainerId))
      .orderBy(desc(projectAssignments.assignedAt));
  }

  async submitProject(submissionData: InsertProjectSubmission): Promise<ProjectSubmission> {
    const [submission] = await db
      .insert(projectSubmissions)
      .values(submissionData)
      .returning();
    return submission;
  }

  async getProjectSubmission(assignmentId: string): Promise<ProjectSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.assignmentId, assignmentId));
    return submission;
  }

  async reviewProjectSubmission(submissionId: string, status: 'approved' | 'rejected', grade?: string, comment?: string): Promise<ProjectSubmission> {
    const [submission] = await db
      .update(projectSubmissions)
      .set({
        status,
        grade,
        trainerComment: comment,
        reviewedAt: new Date(),
      })
      .where(eq(projectSubmissions.id, submissionId))
      .returning();
    return submission;
  }

  async checkCourseCompletion(studentId: string, courseId: string): Promise<boolean> {
    // Check if final project is approved
    const finalProject = await db
      .select()
      .from(projectAssignments)
      .innerJoin(projectSubmissions, eq(projectAssignments.id, projectSubmissions.assignmentId))
      .where(and(
        eq(projectAssignments.studentId, studentId),
        eq(projectAssignments.courseId, courseId),
        eq(projectAssignments.type, 'final'),
        eq(projectSubmissions.status, 'approved')
      ));
    
    return finalProject.length > 0;
  }

  // Certificate operations
  async createCertificateRequest(requestData: InsertCertificateRequest): Promise<CertificateRequest> {
    const [request] = await db
      .insert(certificateRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getCertificateRequestsByStudent(studentId: string): Promise<CertificateRequest[]> {
    return await db
      .select()
      .from(certificateRequests)
      .where(eq(certificateRequests.studentId, studentId))
      .orderBy(desc(certificateRequests.requestedAt));
  }

  async getAllCertificateRequests(): Promise<CertificateRequest[]> {
    return await db
      .select()
      .from(certificateRequests)
      .orderBy(desc(certificateRequests.requestedAt));
  }

  async issueCertificate(requestId: string, issuedBy: string, certificateUrl: string): Promise<CertificateRequest> {
    const [request] = await db
      .update(certificateRequests)
      .set({
        status: 'issued',
        issuedBy,
        certificateUrl,
        issuedAt: new Date(),
      })
      .where(eq(certificateRequests.id, requestId))
      .returning();
    return request;
  }

  async rejectCertificateRequest(requestId: string): Promise<CertificateRequest> {
    const [request] = await db
      .update(certificateRequests)
      .set({ status: 'rejected' })
      .where(eq(certificateRequests.id, requestId))
      .returning();
    return request;
  }
  
  // Student-Trainer assignment operations
  async createStudentTrainerAssignment(assignmentData: InsertStudentTrainerAssignment): Promise<StudentTrainerAssignment> {
    const [assignment] = await db
      .insert(studentTrainerAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async getStudentTrainerAssignments(studentId?: string, trainerId?: string, courseId?: string): Promise<StudentTrainerAssignment[]> {
    const conditions = [];
    
    if (studentId) {
      conditions.push(eq(studentTrainerAssignments.studentId, studentId));
    }
    if (trainerId) {
      conditions.push(eq(studentTrainerAssignments.trainerId, trainerId));
    }
    if (courseId) {
      conditions.push(eq(studentTrainerAssignments.courseId, courseId));
    }
    
    let query = db.select().from(studentTrainerAssignments);
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    return await query.orderBy(studentTrainerAssignments.assignedAt);
  }

  async deleteStudentTrainerAssignment(id: string): Promise<void> {
    await db
      .delete(studentTrainerAssignments)
      .where(eq(studentTrainerAssignments.id, id));
  }

  async getTrainerStudentsByCourse(trainerId: string, courseId: string): Promise<any[]> {
    const assignments = await db
      .select({
        assignmentId: studentTrainerAssignments.id,
        studentId: users.id,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        studentEmail: users.email,
        studentPhone: users.phoneNumber,
        studentProfileImage: users.profileImageUrl,
        courseId: courses.id,
        courseTitle: courses.title,
        assignedAt: studentTrainerAssignments.assignedAt,
      })
      .from(studentTrainerAssignments)
      .innerJoin(users, eq(studentTrainerAssignments.studentId, users.id))
      .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
      .where(and(
        eq(studentTrainerAssignments.trainerId, trainerId),
        eq(studentTrainerAssignments.courseId, courseId)
      ))
      .orderBy(users.firstName);
    
    return assignments;
  }

  async getAllStudentTrainerAssignments(): Promise<any[]> {
    try {
      const assignments = await db
        .select({
          id: studentTrainerAssignments.id,
          studentId: studentTrainerAssignments.studentId,
          studentName: sql<string>`COALESCE(student_users.first_name || ' ' || student_users.last_name, student_users.username)`,
          studentEmail: sql<string>`student_users.email`,
          trainerId: studentTrainerAssignments.trainerId,
          trainerName: sql<string>`COALESCE(trainer_users.first_name || ' ' || trainer_users.last_name, trainer_users.username)`,
          courseId: studentTrainerAssignments.courseId,
          courseTitle: courses.title,
          assignedAt: studentTrainerAssignments.assignedAt,
        })
        .from(studentTrainerAssignments)
        .innerJoin(sql`users as student_users`, sql`student_trainer_assignments.student_id = student_users.id`)
        .innerJoin(sql`users as trainer_users`, sql`student_trainer_assignments.trainer_id = trainer_users.id`)
        .innerJoin(courses, eq(studentTrainerAssignments.courseId, courses.id))
        .orderBy(courses.title, sql`COALESCE(student_users.first_name, student_users.username)`);
      
      return assignments;
    } catch (error) {
      console.error('Error in getAllStudentTrainerAssignments:', error);
      return [];
    }
  }
  
  // Session recording operations
  async createSessionRecording(recordingData: InsertSessionRecording): Promise<SessionRecording> {
    const [recording] = await db
      .insert(sessionRecordings)
      .values(recordingData)
      .returning();
    return recording;
  }

  async getSessionRecordingsByTrainer(trainerId: string): Promise<any[]> {
    const recordings = await db
      .select({
        id: sessionRecordings.id,
        title: sessionRecordings.title,
        description: sessionRecordings.description,
        videoUrl: sessionRecordings.videoUrl,
        fileName: sessionRecordings.fileName,
        fileSize: sessionRecordings.fileSize,
        duration: sessionRecordings.duration,
        uploadedAt: sessionRecordings.uploadedAt,
        scheduleId: sessionRecordings.scheduleId,
        courseTitle: courses.title,
        studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
      })
      .from(sessionRecordings)
      .leftJoin(schedules, eq(sessionRecordings.scheduleId, schedules.id))
      .leftJoin(courses, eq(schedules.courseId, courses.id))
      .leftJoin(users, eq(schedules.studentId, users.id))
      .where(eq(sessionRecordings.trainerId, trainerId))
      .orderBy(desc(sessionRecordings.uploadedAt));
    
    return recordings;
  }

  async getSessionRecordingById(id: string): Promise<SessionRecording | undefined> {
    const [recording] = await db
      .select()
      .from(sessionRecordings)
      .where(eq(sessionRecordings.id, id));
    return recording;
  }

  async shareRecordingWithStudents(recordingId: string, studentIds: string[]): Promise<void> {
    const shares = studentIds.map(studentId => ({
      recordingId,
      studentId,
    }));
    
    await db.insert(sessionRecordingShares).values(shares).onConflictDoNothing();
  }

  async deleteSessionRecording(id: string): Promise<void> {
    await db.delete(sessionRecordings).where(eq(sessionRecordings.id, id));
  }

  async getSharedRecordingsForStudent(studentId: string): Promise<any[]> {
    const recordings = await db
      .select({
        id: sessionRecordings.id,
        title: sessionRecordings.title,
        description: sessionRecordings.description,
        videoUrl: sessionRecordings.videoUrl,
        fileName: sessionRecordings.fileName,
        fileSize: sessionRecordings.fileSize,
        duration: sessionRecordings.duration,
        uploadedAt: sessionRecordings.uploadedAt,
        sharedAt: sessionRecordingShares.sharedAt,
        trainerName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
        courseTitle: courses.title,
      })
      .from(sessionRecordingShares)
      .innerJoin(sessionRecordings, eq(sessionRecordingShares.recordingId, sessionRecordings.id))
      .leftJoin(users, eq(sessionRecordings.trainerId, users.id))
      .leftJoin(schedules, eq(sessionRecordings.scheduleId, schedules.id))
      .leftJoin(courses, eq(schedules.courseId, courses.id))
      .where(eq(sessionRecordingShares.studentId, studentId))
      .orderBy(desc(sessionRecordingShares.sharedAt));
    
    return recordings;
  }
  
  // Module completion request operations
  async createModuleCompletionRequest(requestData: InsertModuleCompletionRequest): Promise<ModuleCompletionRequest> {
    const [request] = await db
      .insert(moduleCompletionRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getModuleCompletionRequestsByStudent(studentId: string): Promise<any[]> {
    const requests = await db
      .select({
        id: moduleCompletionRequests.id,
        moduleId: moduleCompletionRequests.moduleId,
        moduleTitle: modules.title,
        courseTitle: courses.title,
        trainerName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
        message: moduleCompletionRequests.message,
        status: moduleCompletionRequests.status,
        requestedAt: moduleCompletionRequests.requestedAt,
      })
      .from(moduleCompletionRequests)
      .innerJoin(modules, eq(moduleCompletionRequests.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .innerJoin(users, eq(moduleCompletionRequests.trainerId, users.id))
      .where(eq(moduleCompletionRequests.studentId, studentId))
      .orderBy(desc(moduleCompletionRequests.requestedAt));
    
    return requests;
  }

  async respondToCompletionRequest(requestId: string, status: 'completed' | 'dismissed'): Promise<ModuleCompletionRequest> {
    const [request] = await db
      .update(moduleCompletionRequests)
      .set({ status, respondedAt: new Date() })
      .where(eq(moduleCompletionRequests.id, requestId))
      .returning();
    return request;
  }
  
  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.count || 0;
  }
}

export const storage = new DatabaseStorage();
