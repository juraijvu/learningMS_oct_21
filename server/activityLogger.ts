import { storage } from './storage';
import type { InsertActivityLog } from '@shared/schema';
import type { Request } from 'express';

// Helper to get IP address from request
function getIpAddress(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Activity logger service
export class ActivityLogger {
  static async log(
    userId: string,
    action: string,
    options: {
      req?: Request;
      entityType?: string;
      entityId?: string;
      targetUserId?: string;
      details?: any;
    } = {}
  ): Promise<void> {
    const logData: InsertActivityLog = {
      userId,
      action,
      entityType: options.entityType,
      entityId: options.entityId,
      targetUserId: options.targetUserId,
      details: options.details ? options.details : undefined,
      ipAddress: options.req ? getIpAddress(options.req) : undefined,
    };

    try {
      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      // Don't throw - activity logging should not break the main flow
    }
  }

  // Convenience methods for common actions
  static async logLogin(userId: string, req: Request): Promise<void> {
    await this.log(userId, 'login', { req });
  }

  static async logLogout(userId: string, req: Request): Promise<void> {
    await this.log(userId, 'logout', { req });
  }

  static async logCourseCreated(userId: string, courseId: string, req?: Request): Promise<void> {
    await this.log(userId, 'course_created', {
      req,
      entityType: 'course',
      entityId: courseId,
    });
  }

  static async logCourseAssignedToTrainer(
    adminId: string,
    trainerId: string,
    courseId: string,
    courseName: string,
    req?: Request
  ): Promise<void> {
    await this.log(adminId, 'course_assigned_to_trainer', {
      req,
      entityType: 'course',
      entityId: courseId,
      targetUserId: trainerId,
      details: { courseName },
    });
  }

  static async logStudentEnrolled(
    enrolledBy: string,
    studentId: string,
    courseId: string,
    courseName: string,
    req?: Request
  ): Promise<void> {
    await this.log(enrolledBy, 'student_enrolled', {
      req,
      entityType: 'course',
      entityId: courseId,
      targetUserId: studentId,
      details: { courseName },
    });
  }

  static async logMaterialUploaded(
    trainerId: string,
    materialId: string,
    materialType: string,
    materialTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'material_uploaded', {
      req,
      entityType: 'material',
      entityId: materialId,
      details: { materialType, materialTitle },
    });
  }

  static async logMaterialAssigned(
    trainerId: string,
    studentId: string,
    materialId: string,
    materialTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'material_assigned', {
      req,
      entityType: 'material',
      entityId: materialId,
      targetUserId: studentId,
      details: { materialTitle },
    });
  }

  static async logTaskCreated(
    trainerId: string,
    studentId: string,
    taskId: string,
    taskTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'task_created', {
      req,
      entityType: 'task',
      entityId: taskId,
      targetUserId: studentId,
      details: { taskTitle },
    });
  }

  static async logTaskSubmitted(
    studentId: string,
    taskId: string,
    taskTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(studentId, 'task_submitted', {
      req,
      entityType: 'task',
      entityId: taskId,
      details: { taskTitle },
    });
  }

  static async logTaskReviewed(
    trainerId: string,
    studentId: string,
    taskId: string,
    taskTitle: string,
    status: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'task_reviewed', {
      req,
      entityType: 'task',
      entityId: taskId,
      targetUserId: studentId,
      details: { taskTitle, status },
    });
  }

  static async logQueryCreated(
    studentId: string,
    queryId: string,
    req?: Request
  ): Promise<void> {
    await this.log(studentId, 'query_created', {
      req,
      entityType: 'query',
      entityId: queryId,
    });
  }

  static async logQueryResolved(
    trainerId: string,
    studentId: string,
    queryId: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'query_resolved', {
      req,
      entityType: 'query',
      entityId: queryId,
      targetUserId: studentId,
    });
  }

  static async logModuleCompleted(
    studentId: string,
    moduleId: string,
    moduleName: string,
    req?: Request
  ): Promise<void> {
    await this.log(studentId, 'module_completed', {
      req,
      entityType: 'module',
      entityId: moduleId,
      details: { moduleName },
    });
  }

  static async logUserCreated(
    adminId: string,
    newUserId: string,
    username: string,
    role: string,
    req?: Request
  ): Promise<void> {
    await this.log(adminId, 'user_created', {
      req,
      entityType: 'user',
      entityId: newUserId,
      targetUserId: newUserId,
      details: { username, role },
    });
  }
}
