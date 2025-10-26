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

  // Schedule activities
  static async logScheduleCreated(
    createdBy: string,
    scheduleId: string,
    studentId: string,
    courseTitle: string,
    timeSlot: string,
    req?: Request
  ): Promise<void> {
    await this.log(createdBy, 'schedule_created', {
      req,
      entityType: 'schedule',
      entityId: scheduleId,
      targetUserId: studentId,
      details: { courseTitle, timeSlot },
    });
  }

  static async logScheduleStatusChanged(
    changedBy: string,
    studentId: string,
    courseTitle: string,
    oldStatus: string,
    newStatus: string,
    scheduleCount: number,
    req?: Request
  ): Promise<void> {
    await this.log(changedBy, 'schedule_status_changed', {
      req,
      entityType: 'schedule',
      targetUserId: studentId,
      details: { courseTitle, oldStatus, newStatus, scheduleCount },
    });
  }

  // Post activities
  static async logPostCreated(
    authorId: string,
    postId: string,
    req?: Request
  ): Promise<void> {
    await this.log(authorId, 'post_created', {
      req,
      entityType: 'post',
      entityId: postId,
    });
  }

  static async logPostApproved(
    approverId: string,
    authorId: string,
    postId: string,
    req?: Request
  ): Promise<void> {
    await this.log(approverId, 'post_approved', {
      req,
      entityType: 'post',
      entityId: postId,
      targetUserId: authorId,
    });
  }

  static async logPostRejected(
    rejectedBy: string,
    authorId: string,
    postId: string,
    req?: Request
  ): Promise<void> {
    await this.log(rejectedBy, 'post_rejected', {
      req,
      entityType: 'post',
      entityId: postId,
      targetUserId: authorId,
    });
  }

  static async logCommentCreated(
    authorId: string,
    commentId: string,
    postId: string,
    req?: Request
  ): Promise<void> {
    await this.log(authorId, 'comment_created', {
      req,
      entityType: 'comment',
      entityId: commentId,
      details: { postId },
    });
  }

  static async logPostLiked(
    userId: string,
    postId: string,
    liked: boolean,
    req?: Request
  ): Promise<void> {
    await this.log(userId, liked ? 'post_liked' : 'post_unliked', {
      req,
      entityType: 'post',
      entityId: postId,
    });
  }

  // Enrollment request activities
  static async logEnrollmentRequestCreated(
    studentId: string,
    requestId: string,
    courseTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(studentId, 'enrollment_request_created', {
      req,
      entityType: 'enrollment_request',
      entityId: requestId,
      details: { courseTitle },
    });
  }

  static async logEnrollmentRequestApproved(
    reviewerId: string,
    studentId: string,
    requestId: string,
    courseTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(reviewerId, 'enrollment_request_approved', {
      req,
      entityType: 'enrollment_request',
      entityId: requestId,
      targetUserId: studentId,
      details: { courseTitle },
    });
  }

  static async logEnrollmentRequestRejected(
    reviewerId: string,
    studentId: string,
    requestId: string,
    courseTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(reviewerId, 'enrollment_request_rejected', {
      req,
      entityType: 'enrollment_request',
      entityId: requestId,
      targetUserId: studentId,
      details: { courseTitle },
    });
  }

  // Attendance activities
  static async logAttendanceMarked(
    studentId: string,
    attendanceId: string,
    courseTitle: string,
    status: string,
    req?: Request
  ): Promise<void> {
    await this.log(studentId, 'attendance_marked', {
      req,
      entityType: 'attendance',
      entityId: attendanceId,
      details: { courseTitle, status },
    });
  }

  static async logAttendanceVerified(
    trainerId: string,
    studentId: string,
    attendanceId: string,
    courseTitle: string,
    req?: Request
  ): Promise<void> {
    await this.log(trainerId, 'attendance_verified', {
      req,
      entityType: 'attendance',
      entityId: attendanceId,
      targetUserId: studentId,
      details: { courseTitle },
    });
  }

  // Profile activities
  static async logProfileUpdated(
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.log(userId, 'profile_updated', {
      req,
      entityType: 'user',
      entityId: userId,
    });
  }

  static async logPasswordChanged(
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.log(userId, 'password_changed', {
      req,
      entityType: 'user',
      entityId: userId,
    });
  }
}
