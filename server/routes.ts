import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, verifyPassword } from "./auth";
import { insertCourseSchema, insertModuleSchema, insertEnrollmentSchema, insertTaskSchema, insertScheduleSchema, insertQuerySchema, insertUserSchema, insertTrainerAssignmentSchema, insertClassMaterialSchema, insertAttendanceSchema, insertEnrollmentRequestSchema, insertPostSchema, insertPostCommentSchema, classMaterials, posts, postComments, postLikes } from "@shared/schema";
import { db } from "./db";
import { courses, modules, enrollments, users, trainerAssignments, moduleProgress, tasks, schedules, queries, attendance, enrollmentRequests } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { ActivityLogger } from "./activityLogger";
import { emailService } from "./emailService";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import crypto from "crypto";

// Time slot utility functions
function parseTimeSlot(timeSlot: string): { startTime: string; endTime: string } | null {
  const match = timeSlot.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) return null;
  
  return {
    startTime: match[1],
    endTime: match[2],
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doStartTimesMatch(slot1: string, slot2: string): boolean {
  const parsed1 = parseTimeSlot(slot1);
  const parsed2 = parseTimeSlot(slot2);
  
  if (!parsed1 || !parsed2) return false;
  
  // Only check if starting times are the same
  return parsed1.startTime === parsed2.startTime;
}

// Conflict detection function
async function checkTrainerConflict(
  trainerId: string,
  courseId: string,
  timeSlot: string,
  daysOfWeek: number[],
  weekStart: string,
  excludeScheduleId?: string
): Promise<{ hasConflict: boolean; conflictMessage?: string }> {
  try {
    // Get all existing schedules for this trainer
    const existingSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.trainerId, trainerId));
    
    // Filter schedules that might conflict
    for (const existingSchedule of existingSchedules) {
      // Skip if this is the same schedule we're editing
      if (excludeScheduleId && existingSchedule.id === excludeScheduleId) {
        continue;
      }
      
      // Check if days overlap
      if (!daysOfWeek.includes(existingSchedule.dayOfWeek)) {
        continue;
      }
      
      // Check if starting times match
      if (!doStartTimesMatch(timeSlot, existingSchedule.timeSlot)) {
        continue;
      }
      
      // Check if it's a different course (conflict scenario)
      if (existingSchedule.courseId !== courseId) {
        // Get course details for better error message
        const [conflictCourse] = await db
          .select({ title: courses.title })
          .from(courses)
          .where(eq(courses.id, existingSchedule.courseId));
        
        return {
          hasConflict: true,
          conflictMessage: `Trainer is busy: Already scheduled for "${conflictCourse?.title || 'another course'}" at ${existingSchedule.timeSlot} on the same day(s).`
        };
      }
      
      // Same course, same time, same day - this is allowed for batch scheduling
      // No conflict in this case
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('Error checking trainer conflict:', error);
    throw new Error('Failed to check trainer availability');
  }
}

// Role-based middleware
const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);
  
  // Media headers middleware for proper MIME types and CORS
  app.use('/uploads', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    
    // Set proper MIME types
    switch (ext) {
      case '.mp4':
        res.setHeader('Content-Type', 'video/mp4');
        break;
      case '.webm':
        res.setHeader('Content-Type', 'video/webm');
        break;
      case '.ogg':
        res.setHeader('Content-Type', 'video/ogg');
        break;
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
    }
    
    // Enable CORS for media files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length');
    
    // Enable range requests for video
    if (ext === '.mp4' || ext === '.webm' || ext === '.ogg') {
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    next();
  });
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));

  // Login schema
  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });

  // Register schema (admin only)
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(6),
  }).omit({ passwordHash: true });

  // Auth routes
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      // Log login activity
      await ActivityLogger.logLogin(user.id, req);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        mustChangePassword: user.mustChangePassword || false
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', async (req: any, res) => {
    const userId = req.session?.userId;
    
    // Log logout activity before destroying session
    if (userId) {
      await ActivityLogger.logLogout(userId, req);
    }
    
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Change password route (authenticated users)
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const changePasswordSchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(6),
      });
      
      const { currentPassword, newPassword, confirmPassword } = changePasswordSchema.parse(req.body);
      const userId = req.session.userId;
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await hashPassword(newPassword);
      await db.update(users)
        .set({ 
          passwordHash: newPasswordHash, 
          mustChangePassword: false,
          lastPasswordChange: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));
      
      // Log activity
      await ActivityLogger.logPasswordChanged(userId, req);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Register route (admin only)
  app.post('/api/auth/register', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { password, ...userData } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Generate temporary password if not provided
      const temporaryPassword = password || crypto.randomBytes(8).toString('hex');
      const passwordHash = await hashPassword(temporaryPassword);
      
      const user = await storage.createUser({
        ...userData,
        passwordHash,
        mustChangePassword: true,
      });
      
      // Send welcome email with credentials
      if (userData.email) {
        try {
          await emailService.sendWelcomeEmail(
            userData.email,
            userData.firstName || '',
            userData.lastName || '',
            userData.username,
            temporaryPassword,
            userData.role
          );
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail user creation if email fails
        }
      }
      
      // Log activity
      const adminId = req.currentUser?.id || req.session?.userId;
      if (adminId) {
        await ActivityLogger.logUserCreated(adminId, user.id, userData.username, userData.role, req);
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ 
        ...userWithoutPassword,
        temporaryPassword: temporaryPassword // Return for admin reference
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // ============ ADMIN ROUTES ============
  
  // Admin: Get statistics
  app.get("/api/admin/stats", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(courses);
      const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'student'));
      const [schedulesCount] = await db.select({ count: sql<number>`count(*)` }).from(schedules);

      res.json({
        totalUsers: usersCount.count || 0,
        totalCourses: coursesCount.count || 0,
        activeStudents: studentsCount.count || 0,
        weeklySchedules: schedulesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin: Create user (same as register)
  app.post("/api/admin/users", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { password, ...userData } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Generate temporary password if not provided
      const temporaryPassword = password || crypto.randomBytes(8).toString('hex');
      const passwordHash = await hashPassword(temporaryPassword);
      
      const user = await storage.createUser({
        ...userData,
        passwordHash,
        mustChangePassword: true,
      });
      
      // Send welcome email with credentials
      if (userData.email) {
        try {
          await emailService.sendWelcomeEmail(
            userData.email,
            userData.firstName || '',
            userData.lastName || '',
            userData.username,
            temporaryPassword,
            userData.role
          );
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail user creation if email fails
        }
      }
      
      // Log activity
      const adminId = req.currentUser?.id || req.session?.userId;
      if (adminId) {
        await ActivityLogger.logUserCreated(adminId, user.id, userData.username, userData.role, req);
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ 
        ...userWithoutPassword,
        temporaryPassword: temporaryPassword // Return for admin reference
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin: Get all courses
  app.get("/api/admin/courses", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const allCourses = await storage.getAllCourses();
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Admin: Create course
  app.post("/api/admin/courses", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      
      // Log activity
      const adminId = req.currentUser?.id || req.session?.userId;
      if (adminId) {
        await ActivityLogger.logCourseCreated(adminId, course.id, req);
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Admin: Fetch course metadata from URL (extracts OG image and description)
  app.post("/api/admin/courses/fetch-metadata", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { url } = z.object({ url: z.string().url() }).parse(req.body);
      
      // Security: Only allow fetching from orbittraining.ae domain (prevent SSRF)
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname !== 'orbittraining.ae' && !hostname.endsWith('.orbittraining.ae')) {
        return res.status(400).json({ message: "Only orbittraining.ae URLs are allowed for security reasons" });
      }
      
      // Performance: Add 5-second timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // Fetch the HTML content with timeout
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'OrbitLMS/1.0' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return res.status(400).json({ message: "Failed to fetch course page" });
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract OG metadata
        const ogImage = $('meta[property="og:image"]').attr('content') || 
                        $('meta[name="og:image"]').attr('content') ||
                        $('img').first().attr('src');
        
        const ogDescription = $('meta[property="og:description"]').attr('content') || 
                              $('meta[name="og:description"]').attr('content') ||
                              $('meta[name="description"]').attr('content') ||
                              $('p').first().text().trim();
        
        const ogTitle = $('meta[property="og:title"]').attr('content') || 
                        $('meta[name="og:title"]').attr('content') ||
                        $('title').text().trim() ||
                        $('h1').first().text().trim();
        
        res.json({
          title: ogTitle,
          description: ogDescription,
          imageUrl: ogImage
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return res.status(408).json({ message: "Request timeout - the course page took too long to respond" });
        }
        throw fetchError;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      console.error("Error fetching course metadata:", error);
      res.status(500).json({ message: "Failed to fetch course metadata" });
    }
  });

  // Admin: Assign trainer to course
  app.post("/api/admin/trainer-assignments", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      // Add assignedBy from the current admin user
      const assignmentData = insertTrainerAssignmentSchema.parse({
        ...req.body,
        assignedBy: req.currentUser?.id || req.session?.userId,
      });
      
      // Check if trainer is already assigned to this course
      const existingAssignments = await storage.getTrainerAssignments(assignmentData.trainerId);
      const alreadyAssigned = existingAssignments.some(a => a.courseId === assignmentData.courseId);
      
      if (alreadyAssigned) {
        return res.status(400).json({ message: "Trainer is already assigned to this course" });
      }

      const assignment = await storage.createTrainerAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error assigning trainer:", error);
      res.status(500).json({ message: "Failed to assign trainer" });
    }
  });

  // ============ SALES CONSULTANT ROUTES ============

  // Sales: Get statistics
  app.get("/api/sales/stats", isAuthenticated, requireRole(['sales_consultant']), async (req: any, res) => {
    try {
      const userId = req.currentUser?.id || req.session?.userId;
      const [myEnrollments] = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.enrolledBy, userId));
      const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(courses);
      const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'student'));
      const [schedulesCount] = await db.select({ count: sql<number>`count(*)` }).from(schedules);

      res.json({
        myEnrollments: myEnrollments.count || 0,
        totalCourses: coursesCount.count || 0,
        activeStudents: studentsCount.count || 0,
        weeklySchedules: schedulesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching sales stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ============ TRAINER ROUTES ============

  // Trainer: Get statistics
  app.get("/api/trainer/stats", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser?.id || req.session?.userId;
      const [myCoursesCount] = await db.select({ count: sql<number>`count(*)` }).from(trainerAssignments).where(eq(trainerAssignments.trainerId, trainerId));
      
      // Get student count from enrollments in trainer's courses
      const trainerCourses = await db.select({ courseId: trainerAssignments.courseId }).from(trainerAssignments).where(eq(trainerAssignments.trainerId, trainerId));
      const courseIds = trainerCourses.map(tc => tc.courseId);
      const [studentsCount] = courseIds.length > 0 
        ? await db.select({ count: sql<number>`count(distinct ${enrollments.studentId})` }).from(enrollments).where(inArray(enrollments.courseId, courseIds))
        : [{ count: 0 }];
      
      const [pendingTasksCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(eq(tasks.assignedBy, trainerId), eq(tasks.status, 'submitted')));
      const [schedulesCount] = await db.select({ count: sql<number>`count(*)` }).from(schedules).where(eq(schedules.trainerId, trainerId));

      res.json({
        myCourses: myCoursesCount.count || 0,
        myStudents: studentsCount.count || 0,
        pendingTasks: pendingTasksCount.count || 0,
        weeklySchedules: schedulesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching trainer stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Trainer: Get assigned courses
  app.get("/api/trainer/courses", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser?.id || req.session?.userId;
      const assignments = await storage.getTrainerAssignments(trainerId);
      
      const coursesWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const course = await storage.getCourse(assignment.courseId);
          const courseModules = await storage.getModulesByCourse(assignment.courseId);
          const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.courseId, assignment.courseId));
          
          return {
            ...course,
            moduleCount: courseModules.length,
            studentCount: enrollmentCount.count || 0,
          };
        })
      );

      res.json(coursesWithDetails);
    } catch (error) {
      console.error("Error fetching trainer courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // ============ STUDENT ROUTES ============

  // Student: Get statistics
  app.get("/api/student/stats", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser?.id || req.session?.userId;
      const [enrolledCount] = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(eq(enrollments.studentId, studentId));
      const [completedCount] = await db.select({ count: sql<number>`count(*)` }).from(moduleProgress).where(and(eq(moduleProgress.studentId, studentId), eq(moduleProgress.isCompleted, true)));
      const [totalModulesCount] = await db.select({ count: sql<number>`count(*)` }).from(moduleProgress).where(eq(moduleProgress.studentId, studentId));
      const [pendingTasksCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(eq(tasks.studentId, studentId), eq(tasks.status, 'pending')));
      const [schedulesCount] = await db.select({ count: sql<number>`count(*)` }).from(schedules).where(eq(schedules.studentId, studentId));

      res.json({
        enrolledCourses: enrolledCount.count || 0,
        completedModules: completedCount.count || 0,
        totalModules: totalModulesCount.count || 0,
        pendingTasks: pendingTasksCount.count || 0,
        weeklySchedules: schedulesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Student: Get enrolled courses
  app.get("/api/student/courses", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser?.id || req.session?.userId;
      const studentEnrollments = await storage.getEnrollmentsByStudent(studentId);
      
      const coursesWithProgress = await Promise.all(
        studentEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          const courseModules = await storage.getModulesByCourse(enrollment.courseId);
          const progress = await storage.getStudentProgress(studentId);
          const completedInCourse = progress.filter(p => 
            p.isCompleted && courseModules.some(m => m.id === p.moduleId)
          ).length;
          
          return {
            ...course,
            moduleCount: courseModules.length,
            completedModules: completedInCourse,
          };
        })
      );

      res.json(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Student: Get progress
  app.get("/api/student/progress", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser?.id || req.session?.userId;
      const progress = await storage.getStudentProgress(studentId);
      
      const progressWithDetails = await Promise.all(
        progress.map(async (p) => {
          const [module] = await db.select().from(modules).where(eq(modules.id, p.moduleId));
          const [course] = await db.select().from(courses).where(eq(courses.id, module.courseId));
          
          return {
            id: p.id,
            moduleId: module.id,
            title: module.title,
            courseTitle: course.title,
            subPoints: module.subPoints,
            isCompleted: p.isCompleted,
            completedAt: p.completedAt,
          };
        })
      );

      res.json(progressWithDetails);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Student: Mark module as complete
  app.post("/api/student/progress/:moduleId/complete", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const { moduleId } = req.params;
      const studentId = req.currentUser?.id || req.session?.userId;
      
      const progressData = {
        studentId,
        moduleId,
        isCompleted: true,
        completedBy: studentId,
      };
      
      const updatedProgress = await storage.updateModuleProgress(progressData);
      
      // Log activity
      const [module] = await db.select().from(modules).where(eq(modules.id, moduleId));
      if (module) {
        await ActivityLogger.logModuleCompleted(studentId, moduleId, module.title, req);
      }
      
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error marking module complete:", error);
      res.status(500).json({ message: "Failed to mark module as complete" });
    }
  });

  // Student: Get attendance
  app.get("/api/student/attendance", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser?.id || req.session?.userId;
      const studentAttendance = await storage.getAttendanceByStudent(studentId);
      
      const attendanceWithDetails = await Promise.all(
        studentAttendance.map(async (att) => {
          const [schedule] = await db.select().from(schedules).where(eq(schedules.id, att.scheduleId));
          const [course] = schedule ? await db.select().from(courses).where(eq(courses.id, schedule.courseId)) : [null];
          const [trainer] = schedule?.trainerId ? await db.select().from(users).where(eq(users.id, schedule.trainerId)) : [null];
          
          return {
            ...att,
            courseTitle: course?.title || '',
            trainerName: trainer ? `${trainer.firstName} ${trainer.lastName}` : 'TBA',
            timeSlot: schedule?.timeSlot || '',
            dayOfWeek: schedule?.dayOfWeek || 0,
          };
        })
      );

      res.json(attendanceWithDetails);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Student: Mark attendance
  app.post("/api/student/attendance", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser?.id || req.session?.userId;
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        studentId,
      });
      
      const attendance = await storage.createAttendance(attendanceData);
      
      // Log activity
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, attendanceData.scheduleId));
      if (schedule) {
        const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
        await ActivityLogger.logAttendanceMarked(
          studentId,
          attendance.id,
          course?.title || 'Unknown Course',
          attendanceData.status || 'present',
          req
        );
      }
      
      res.json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  // Trainer: Get attendance for verification
  app.get("/api/trainer/attendance", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const trainerAttendance = await storage.getAttendanceByTrainer(trainerId);
      
      const attendanceWithDetails = await Promise.all(
        trainerAttendance.map(async (att) => {
          const [schedule] = await db.select().from(schedules).where(eq(schedules.id, att.scheduleId));
          const [course] = schedule ? await db.select().from(courses).where(eq(courses.id, schedule.courseId)) : [null];
          const [student] = await db.select().from(users).where(eq(users.id, att.studentId));
          
          return {
            ...att,
            courseTitle: course?.title || '',
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
            timeSlot: schedule?.timeSlot || '',
            dayOfWeek: schedule?.dayOfWeek || 0,
          };
        })
      );

      res.json(attendanceWithDetails);
    } catch (error) {
      console.error("Error fetching trainer attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Trainer: Verify attendance
  app.patch("/api/trainer/attendance/:id/verify", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const trainerId = req.currentUser.id;
      
      const verifiedAttendance = await storage.verifyAttendance(id, trainerId, notes);
      
      // Log activity
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, verifiedAttendance.scheduleId));
      if (schedule) {
        const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
        await ActivityLogger.logAttendanceVerified(
          trainerId,
          verifiedAttendance.studentId,
          id,
          course?.title || 'Unknown Course',
          req
        );
      }
      
      res.json(verifiedAttendance);
    } catch (error) {
      console.error("Error verifying attendance:", error);
      res.status(500).json({ message: "Failed to verify attendance" });
    }
  });

  // Student: Get tasks
  app.get("/api/student/tasks", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const studentTasks = await storage.getTasksByStudent(studentId);
      res.json(studentTasks);
    } catch (error) {
      console.error("Error fetching student tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Student: Submit task
  app.post("/api/student/tasks/:taskId/submit", isAuthenticated, requireRole(['student']), async (req, res) => {
    try {
      const { taskId } = req.params;
      const { fileUrl } = req.body;
      
      const updatedTask = await storage.updateTask(taskId, {
        fileUrl,
        status: 'submitted',
        submittedAt: new Date(),
      });
      
      // Log activity
      const studentId = req.currentUser?.id || req.session?.userId;
      if (studentId) {
        await ActivityLogger.logTaskSubmitted(studentId, taskId, updatedTask.title, req);
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error submitting task:", error);
      res.status(500).json({ message: "Failed to submit task" });
    }
  });

  // Student: Get queries
  app.get("/api/student/queries", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const studentQueries = await storage.getQueriesByStudent(studentId);
      
      const queriesWithDetails = await Promise.all(
        studentQueries.map(async (query) => {
          const [module] = await db.select().from(modules).where(eq(modules.id, query.moduleId));
          const [course] = await db.select().from(courses).where(eq(courses.id, module.courseId));
          
          return {
            ...query,
            moduleTitle: module.title,
            courseTitle: course.title,
          };
        })
      );

      res.json(queriesWithDetails);
    } catch (error) {
      console.error("Error fetching student queries:", error);
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  // Student: Get available modules
  app.get("/api/student/modules", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const studentEnrollments = await storage.getEnrollmentsByStudent(studentId);
      
      const allModules = await Promise.all(
        studentEnrollments.map(async (enrollment) => {
          const courseModules = await storage.getModulesByCourse(enrollment.courseId);
          const course = await storage.getCourse(enrollment.courseId);
          
          return courseModules.map(module => ({
            id: module.id,
            title: module.title,
            courseTitle: course?.title || '',
          }));
        })
      );

      res.json(allModules.flat());
    } catch (error) {
      console.error("Error fetching student modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Student: Create query
  app.post("/api/student/queries", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const queryData = insertQuerySchema.parse({ ...req.body, studentId });
      const query = await storage.createQuery(queryData);
      
      // Log activity
      await ActivityLogger.logQueryCreated(studentId, query.id, req);
      
      res.json(query);
    } catch (error) {
      console.error("Error creating query:", error);
      res.status(500).json({ message: "Failed to create query" });
    }
  });

  // Trainer: Get queries from students
  app.get("/api/trainer/queries", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const trainerQueries = await storage.getQueriesByTrainer(trainerId);
      
      const queriesWithDetails = await Promise.all(
        trainerQueries.map(async (query) => {
          const [module] = await db.select().from(modules).where(eq(modules.id, query.moduleId));
          const [course] = await db.select().from(courses).where(eq(courses.id, module.courseId));
          const [student] = await db.select().from(users).where(eq(users.id, query.studentId));
          
          return {
            ...query,
            moduleTitle: module.title,
            courseTitle: course.title,
            studentName: `${student.firstName} ${student.lastName}`,
          };
        })
      );

      res.json(queriesWithDetails);
    } catch (error) {
      console.error("Error fetching trainer queries:", error);
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  // Trainer: Respond to query
  app.patch("/api/trainer/queries/:id/respond", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      
      if (!response || response.trim() === '') {
        return res.status(400).json({ message: "Response cannot be empty" });
      }
      
      const updatedQuery = await storage.updateQuery(id, {
        response: response.trim(),
        isResolved: true,
        resolvedAt: new Date(),
      });
      
      // Log activity
      const trainerId = req.currentUser?.id || req.session?.userId;
      if (trainerId) {
        await ActivityLogger.logQueryResolved(trainerId, updatedQuery.studentId, id, req);
      }
      
      res.json(updatedQuery);
    } catch (error) {
      console.error("Error responding to query:", error);
      res.status(500).json({ message: "Failed to respond to query" });
    }
  });

  // Student: Get schedule (only active schedules)
  app.get("/api/student/schedule", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const studentSchedules = await db.select()
        .from(schedules)
        .where(and(
          eq(schedules.studentId, studentId),
          sql`(${schedules.status} = 'active' OR ${schedules.status} IS NULL)`
        ))
        .orderBy(schedules.weekStart, schedules.dayOfWeek);
      
      const schedulesWithDetails = await Promise.all(
        studentSchedules.map(async (schedule) => {
          const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
          const [trainer] = schedule.trainerId 
            ? await db.select().from(users).where(eq(users.id, schedule.trainerId))
            : [null];
          
          return {
            ...schedule,
            courseTitle: course?.title || '',
            trainerName: trainer ? `${trainer.firstName} ${trainer.lastName}` : 'TBA',
            status: schedule.status || 'active',
          };
        })
      );

      res.json(schedulesWithDetails);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  // Admin: Get all schedules
  app.get("/api/admin/schedules", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const allSchedules = await db.select().from(schedules).orderBy(schedules.weekStart, schedules.dayOfWeek);
      
      const schedulesWithDetails = await Promise.all(
        allSchedules.map(async (schedule) => {
          const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
          const [student] = schedule.studentId 
            ? await db.select().from(users).where(eq(users.id, schedule.studentId))
            : [null];
          const [trainer] = schedule.trainerId 
            ? await db.select().from(users).where(eq(users.id, schedule.trainerId))
            : [null];
          
          return {
            ...schedule,
            courseTitle: course?.title || '',
            studentName: student ? `${student.firstName} ${student.lastName}` : 'TBA',
            trainerName: trainer ? `${trainer.firstName} ${trainer.lastName}` : 'TBA',
            status: schedule.status || 'active', // Ensure status is included
          };
        })
      );

      res.json(schedulesWithDetails);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Trainer: Get schedules
  app.get("/api/trainer/schedules", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const trainerSchedules = await storage.getSchedulesByTrainer(trainerId);
      
      const schedulesWithDetails = await Promise.all(
        trainerSchedules.map(async (schedule) => {
          const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
          const [student] = schedule.studentId 
            ? await db.select().from(users).where(eq(users.id, schedule.studentId))
            : [null];
          
          return {
            ...schedule,
            courseTitle: course?.title || '',
            studentName: student ? `${student.firstName} ${student.lastName}` : 'TBA',
            status: schedule.status || 'active',
          };
        })
      );

      res.json(schedulesWithDetails);
    } catch (error) {
      console.error("Error fetching trainer schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Sales: Get all schedules
  app.get("/api/sales/schedules", isAuthenticated, requireRole(['sales_consultant']), async (req, res) => {
    try {
      const allSchedules = await db.select().from(schedules).orderBy(schedules.weekStart, schedules.dayOfWeek);
      
      const schedulesWithDetails = await Promise.all(
        allSchedules.map(async (schedule) => {
          const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
          const [student] = schedule.studentId 
            ? await db.select().from(users).where(eq(users.id, schedule.studentId))
            : [null];
          const [trainer] = schedule.trainerId 
            ? await db.select().from(users).where(eq(users.id, schedule.trainerId))
            : [null];
          
          return {
            ...schedule,
            courseTitle: course?.title || '',
            studentName: student ? `${student.firstName} ${student.lastName}` : 'TBA',
            trainerName: trainer ? `${trainer.firstName} ${trainer.lastName}` : 'TBA',
            status: schedule.status || 'active', // Ensure status is included
          };
        })
      );

      res.json(schedulesWithDetails);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Admin: Get single schedule
  app.get("/api/admin/schedules/:id", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  // Admin: Create schedule
  app.post("/api/admin/schedules", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { courseId, studentId, trainerId, weekStart, dayOfWeek, timeSlot } = req.body;
      
      const scheduleData = insertScheduleSchema.parse({
        courseId,
        studentId,
        trainerId,
        weekStart,
        dayOfWeek,
        timeSlot,
        createdBy: req.currentUser.id,
      });
      
      // Check for trainer conflicts
      const conflictCheck = await checkTrainerConflict(
        trainerId,
        courseId,
        timeSlot,
        [dayOfWeek],
        weekStart
      );
      
      if (conflictCheck.hasConflict) {
        return res.status(409).json({ message: conflictCheck.conflictMessage });
      }
      
      const schedule = await storage.createSchedule(scheduleData);
      
      // Log activity
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      await ActivityLogger.logScheduleCreated(
        req.currentUser.id,
        schedule.id,
        studentId,
        course?.title || 'Unknown Course',
        timeSlot,
        req
      );
      
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Sales: Get single schedule
  app.get("/api/sales/schedules/:id", isAuthenticated, requireRole(['sales_consultant']), async (req, res) => {
    try {
      const { id } = req.params;
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  // Sales: Create schedule
  app.post("/api/sales/schedules", isAuthenticated, requireRole(['sales_consultant']), async (req: any, res) => {
    try {
      const { courseId, studentId, trainerId, weekStart, dayOfWeek, timeSlot } = req.body;
      
      const scheduleData = insertScheduleSchema.parse({
        courseId,
        studentId,
        trainerId,
        weekStart,
        dayOfWeek,
        timeSlot,
        createdBy: req.currentUser.id,
      });
      
      // Check for trainer conflicts
      const conflictCheck = await checkTrainerConflict(
        trainerId,
        courseId,
        timeSlot,
        [dayOfWeek],
        weekStart
      );
      
      if (conflictCheck.hasConflict) {
        return res.status(409).json({ message: conflictCheck.conflictMessage });
      }
      
      const schedule = await storage.createSchedule(scheduleData);
      
      // Log activity
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      await ActivityLogger.logScheduleCreated(
        req.currentUser.id,
        schedule.id,
        studentId,
        course?.title || 'Unknown Course',
        timeSlot,
        req
      );
      
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Admin: Update schedule
  app.put("/api/admin/schedules/:id", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { courseId, studentId, trainerId, weekStart, dayOfWeek, timeSlot } = req.body;
      
      const updateData = insertScheduleSchema.partial().parse({
        courseId,
        studentId,
        trainerId,
        weekStart,
        dayOfWeek,
        timeSlot,
      });
      
      // Check for trainer conflicts (excluding current schedule)
      if (trainerId && timeSlot && dayOfWeek !== undefined && courseId) {
        const conflictCheck = await checkTrainerConflict(
          trainerId,
          courseId,
          timeSlot,
          [dayOfWeek],
          weekStart || new Date().toISOString(),
          id // Exclude current schedule from conflict check
        );
        
        if (conflictCheck.hasConflict) {
          return res.status(409).json({ message: conflictCheck.conflictMessage });
        }
      }
      
      const updatedSchedule = await storage.updateSchedule(id, updateData);
      res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });
  
  // Admin: Update schedule status (bulk update for student-course)
  app.patch("/api/admin/schedules/:id/status", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['active', 'paused', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the schedule to find student and course
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Update all schedules for this student-course combination
      await db.update(schedules)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(schedules.studentId, schedule.studentId),
          eq(schedules.courseId, schedule.courseId)
        ));
      
      // Get updated count
      const [updatedCount] = await db.select({ count: sql<number>`count(*)` })
        .from(schedules)
        .where(and(
          eq(schedules.studentId, schedule.studentId),
          eq(schedules.courseId, schedule.courseId)
        ));
      
      res.json({ 
        message: `Updated ${updatedCount.count} schedules to ${status}`,
        updatedCount: updatedCount.count
      });
    } catch (error) {
      console.error("Error updating schedule status:", error);
      res.status(500).json({ message: "Failed to update schedule status" });
    }
  });

  // Sales: Update schedule
  app.put("/api/sales/schedules/:id", isAuthenticated, requireRole(['sales_consultant']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { courseId, studentId, trainerId, weekStart, dayOfWeek, timeSlot } = req.body;
      
      const updateData = insertScheduleSchema.partial().parse({
        courseId,
        studentId,
        trainerId,
        weekStart,
        dayOfWeek,
        timeSlot,
      });
      
      // Check for trainer conflicts (excluding current schedule)
      if (trainerId && timeSlot && dayOfWeek !== undefined && courseId) {
        const conflictCheck = await checkTrainerConflict(
          trainerId,
          courseId,
          timeSlot,
          [dayOfWeek],
          weekStart || new Date().toISOString(),
          id // Exclude current schedule from conflict check
        );
        
        if (conflictCheck.hasConflict) {
          return res.status(409).json({ message: conflictCheck.conflictMessage });
        }
      }
      
      const updatedSchedule = await storage.updateSchedule(id, updateData);
      res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // Sales: Update schedule status (bulk update for student-course)
  app.patch("/api/sales/schedules/:id/status", isAuthenticated, requireRole(['sales_consultant']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['active', 'paused', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the schedule to find student and course
      const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Update all schedules for this student-course combination
      await db.update(schedules)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(schedules.studentId, schedule.studentId),
          eq(schedules.courseId, schedule.courseId)
        ));
      
      // Get updated count
      const [updatedCount] = await db.select({ count: sql<number>`count(*)` })
        .from(schedules)
        .where(and(
          eq(schedules.studentId, schedule.studentId),
          eq(schedules.courseId, schedule.courseId)
        ));
      
      // Log activity
      const [course] = await db.select().from(courses).where(eq(courses.id, schedule.courseId));
      await ActivityLogger.logScheduleStatusChanged(
        req.currentUser?.id || req.session?.userId,
        schedule.studentId,
        course?.title || 'Unknown Course',
        schedule.status || 'active',
        status,
        updatedCount.count,
        req
      );
      
      res.json({ 
        message: `Updated ${updatedCount.count} schedules to ${status}`,
        updatedCount: updatedCount.count
      });
    } catch (error) {
      console.error("Error updating schedule status:", error);
      res.status(500).json({ message: "Failed to update schedule status" });
    }
  });

  // Admin: Get course modules
  app.get("/api/admin/courses/:courseId/modules", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { courseId } = req.params;
      const courseModules = await storage.getModulesByCourse(courseId);
      res.json(courseModules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Admin: Create course module
  app.post("/api/admin/courses/:courseId/modules", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { courseId } = req.params;
      const moduleData = insertModuleSchema.parse({ ...req.body, courseId });
      const module = await storage.createModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  // Trainer: Get tasks to review
  app.get("/api/trainer/tasks", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const trainerTasks = await storage.getTasksByTrainer(trainerId);
      
      // Enrich with student names
      const tasksWithStudentNames = await Promise.all(
        trainerTasks.map(async (task) => {
          const student = await storage.getUser(task.studentId);
          return {
            ...task,
            studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username : 'Unknown'
          };
        })
      );
      
      res.json(tasksWithStudentNames);
    } catch (error) {
      console.error("Error fetching trainer tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Trainer: Create task
  app.post("/api/trainer/tasks", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        assignedBy: trainerId,
      });
      
      const task = await storage.createTask(taskData);
      
      // Log activity
      await ActivityLogger.logTaskCreated(trainerId, task.studentId, task.id, task.title, req);
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Trainer: Approve task
  app.patch("/api/trainer/tasks/:taskId/approve", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { taskId } = req.params;
      
      const updatedTask = await storage.updateTask(taskId, {
        status: 'approved',
        reviewedAt: new Date(),
      });
      
      // Log activity
      const trainerId = req.currentUser?.id || req.session?.userId;
      if (trainerId) {
        await ActivityLogger.logTaskReviewed(trainerId, updatedTask.studentId, taskId, updatedTask.title, 'approved', req);
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error approving task:", error);
      res.status(500).json({ message: "Failed to approve task" });
    }
  });

  // Trainer: Reject task
  app.patch("/api/trainer/tasks/:taskId/reject", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { taskId } = req.params;
      
      const updatedTask = await storage.updateTask(taskId, {
        status: 'pending',
        reviewedAt: new Date(),
      });
      
      // Log activity
      const trainerId = req.currentUser?.id || req.session?.userId;
      if (trainerId) {
        await ActivityLogger.logTaskReviewed(trainerId, updatedTask.studentId, taskId, updatedTask.title, 'rejected', req);
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error rejecting task:", error);
      res.status(500).json({ message: "Failed to reject task" });
    }
  });

  // Trainer: Get all students from assigned courses
  app.get("/api/trainer/students", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      
      // Use a single query with joins to get all students enrolled in trainer's courses
      const studentsQuery = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(enrollments, eq(users.id, enrollments.studentId))
        .innerJoin(trainerAssignments, eq(enrollments.courseId, trainerAssignments.courseId))
        .where(and(
          eq(trainerAssignments.trainerId, trainerId),
          eq(users.role, 'student')
        ))
        .groupBy(users.id, users.username, users.email, users.firstName, users.lastName, users.role, users.profileImageUrl, users.createdAt, users.updatedAt);
      
      res.json(studentsQuery);
    } catch (error) {
      console.error("Error fetching trainer students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Trainer: Get course students
  app.get("/api/trainer/courses/:courseId/students", isAuthenticated, requireRole(['trainer']), async (req, res) => {
    try {
      const { courseId } = req.params;
      const courseEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
      
      const studentsWithDetails = await Promise.all(
        courseEnrollments.map(async (enrollment) => {
          const [student] = await db.select().from(users).where(eq(users.id, enrollment.studentId));
          return student;
        })
      );

      res.json(studentsWithDetails.filter(s => s !== undefined));
    } catch (error) {
      console.error("Error fetching course students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Trainer: Get course modules
  app.get("/api/trainer/courses/:courseId/modules", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const trainerId = req.currentUser.id;
      
      console.log('Trainer requesting modules:', { trainerId, courseId });
      
      // Verify trainer is assigned to this course
      const assignment = await db.select().from(trainerAssignments)
        .where(and(
          eq(trainerAssignments.trainerId, trainerId),
          eq(trainerAssignments.courseId, courseId)
        ));
      
      console.log('Trainer assignments found:', assignment);
      
      if (assignment.length === 0) {
        console.log('Trainer not assigned to course, checking all assignments for trainer');
        const allAssignments = await db.select().from(trainerAssignments)
          .where(eq(trainerAssignments.trainerId, trainerId));
        console.log('All trainer assignments:', allAssignments);
        return res.status(403).json({ message: "You are not assigned to this course" });
      }
      
      const courseModules = await storage.getModulesByCourse(courseId);
      console.log('Modules found:', courseModules);
      res.json(courseModules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Public: Get all courses (for all authenticated users)
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const allCourses = await storage.getAllCourses();
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Public: Get course by ID
  app.get("/api/courses/:courseId", isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Public: Get course modules
  app.get("/api/courses/:courseId/modules", isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const courseModules = await storage.getModulesByCourse(courseId);
      res.json(courseModules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Class Materials Routes
  
  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
      // Accept videos, documents, and images
      const allowedTypes = [
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only videos, documents, and images are allowed.'));
      }
    }
  });

  // Trainer: Upload class material
  app.post("/api/class-materials", isAuthenticated, requireRole(['trainer']), upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const uploadSchema = z.object({
        courseId: z.string(),
        type: z.enum(['video', 'note']),
        title: z.string().min(1),
        description: z.string().optional(),
        allowDownload: z.string().transform(val => val === 'true').optional().default(true),
      });

      const data = uploadSchema.parse(req.body);
      const trainerId = req.currentUser.id;

      // Calculate expiration date (10 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 10);

      // Create material record
      const material = await storage.createClassMaterial({
        courseId: data.courseId,
        trainerId,
        type: data.type,
        title: data.title,
        description: data.description || null,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        allowDownload: data.allowDownload,
        expiresAt,
      });
      
      // Log activity
      await ActivityLogger.logMaterialUploaded(trainerId, material.id, data.type, data.title, req);

      res.json(material);
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error uploading class material:", error);
      res.status(500).json({ message: "Failed to upload class material" });
    }
  });

  // Get class materials for a course
  app.get("/api/class-materials/:courseId", isAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const materials = await storage.getClassMaterialsByCourse(courseId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching class materials:", error);
      res.status(500).json({ message: "Failed to fetch class materials" });
    }
  });

  // Download class material
  app.get("/api/class-materials/download/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getClassMaterialById(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check if download is allowed
      if (!material.allowDownload) {
        return res.status(403).json({ message: "Download is not allowed for this material" });
      }

      const filePath = path.join(process.cwd(), material.fileUrl);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: "File not found on server" });
      }

      res.download(filePath, material.fileName);
    } catch (error) {
      console.error("Error downloading class material:", error);
      res.status(500).json({ message: "Failed to download material" });
    }
  });

  // View class material (for inline viewing)
  app.get("/api/class-materials/view/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getClassMaterialById(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const filePath = path.join(process.cwd(), material.fileUrl);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: "File not found on server" });
      }

      // Set appropriate content type for inline viewing
      const ext = path.extname(material.fileName).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      
      const fileStream = fsSync.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing class material:", error);
      res.status(500).json({ message: "Failed to view material" });
    }
  });

  // Trainer: Delete class material
  app.delete("/api/class-materials/:id", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getClassMaterialById(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if the trainer is the owner
      if (material.trainerId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only delete your own materials" });
      }

      // Delete file from filesystem
      const filePath = path.join(process.cwd(), material.fileUrl);
      await fs.unlink(filePath).catch(() => {});

      // Delete from database
      await storage.deleteClassMaterial(id);

      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting class material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Trainer: Assign material to students
  app.post("/api/class-materials/:materialId/assign", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const { materialId } = req.params;
      const assignSchema = z.object({
        studentIds: z.array(z.string()).min(1),
      });

      const { studentIds } = assignSchema.parse(req.body);
      
      // Verify material exists and belongs to trainer
      const material = await storage.getClassMaterialById(materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      if (material.trainerId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only assign your own materials" });
      }

      // Assign to each student
      const assignments = await Promise.all(
        studentIds.map(studentId => storage.assignMaterialToStudent(materialId, studentId))
      );
      
      // Log activity for each assignment
      await Promise.all(
        studentIds.map(studentId => 
          ActivityLogger.logMaterialAssigned(req.currentUser.id, studentId, materialId, material.title, req)
        )
      );

      res.json({ 
        message: `Material assigned to ${studentIds.length} student(s)`,
        assignments 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error assigning material:", error);
      res.status(500).json({ message: "Failed to assign material" });
    }
  });

  // Get trainer's materials
  app.get("/api/trainer/materials", isAuthenticated, requireRole(['trainer']), async (req: any, res) => {
    try {
      const trainerId = req.currentUser.id;
      const materials = await storage.getClassMaterialsByTrainer(trainerId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching trainer materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Get student's assigned materials
  app.get("/api/student/materials", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const materials = await storage.getStudentMaterials(studentId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching student materials:", error);
      res.status(500).json({ message: "Failed to fetch student materials" });
    }
  });

  // Cleanup expired materials (can be called by a cron job or manually)
  app.post("/api/class-materials/cleanup", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      // Get expired materials before deleting
      const expiredMaterials = await db
        .select()
        .from(classMaterials)
        .where(sql`${classMaterials.expiresAt} < ${new Date()}`);

      // Delete files from filesystem
      for (const material of expiredMaterials) {
        const filePath = path.join(process.cwd(), material.fileUrl);
        await fs.unlink(filePath).catch(() => {});
      }

      // Delete from database
      const deletedCount = await storage.deleteExpiredMaterials();

      res.json({ 
        message: `Cleaned up ${deletedCount} expired materials`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error cleaning up expired materials:", error);
      res.status(500).json({ message: "Failed to cleanup materials" });
    }
  });

  // ==================== ADMIN ACTIVITY LOGS ====================
  
  // Get all activity logs (admin only)
  app.get("/api/admin/activity-logs", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;

      let logs;
      if (userId) {
        logs = await storage.getActivityLogsByUser(userId, limit);
      } else if (action) {
        logs = await storage.getActivityLogsByAction(action, limit);
      } else {
        logs = await storage.getAllActivityLogs(limit);
      }

      // Fetch user details for each log
      const logsWithUserDetails = await Promise.all(
        logs.map(async (log) => {
          const user = await storage.getUser(log.userId);
          let targetUser = null;
          if (log.targetUserId) {
            targetUser = await storage.getUser(log.targetUserId);
          }
          
          return {
            ...log,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            } : null,
            targetUser: targetUser ? {
              id: targetUser.id,
              username: targetUser.username,
              firstName: targetUser.firstName,
              lastName: targetUser.lastName,
              role: targetUser.role,
            } : null,
          };
        })
      );

      res.json(logsWithUserDetails);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // ==================== ADMIN COURSE ASSIGNMENTS ====================
  
  // Admin: Assign course to trainer
  app.post("/api/admin/assign-course-to-trainer", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const assignSchema = z.object({
        trainerId: z.string(),
        courseId: z.string(),
      });

      const { trainerId, courseId } = assignSchema.parse(req.body);
      const adminId = req.currentUser?.id || req.session?.userId;

      // Verify trainer exists and has trainer role
      const trainer = await storage.getUser(trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        return res.status(400).json({ message: "Invalid trainer ID" });
      }

      // Verify course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if already assigned
      const existingAssignments = await db
        .select()
        .from(trainerAssignments)
        .where(and(
          eq(trainerAssignments.trainerId, trainerId),
          eq(trainerAssignments.courseId, courseId)
        ));

      if (existingAssignments.length > 0) {
        return res.status(400).json({ message: "Trainer already assigned to this course" });
      }

      // Create assignment
      const assignment = await storage.createTrainerAssignment({
        trainerId,
        courseId,
        assignedBy: adminId,
      });

      // Log activity
      await ActivityLogger.logCourseAssignedToTrainer(
        adminId,
        trainerId,
        courseId,
        course.title,
        req
      );

      res.json({ 
        message: `Course "${course.title}" assigned to trainer ${trainer.username}`,
        assignment 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error assigning course to trainer:", error);
      res.status(500).json({ message: "Failed to assign course to trainer" });
    }
  });

  // Admin: Enroll student in course
  app.post("/api/admin/enroll-student", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const enrollSchema = z.object({
        studentId: z.string(),
        courseId: z.string(),
      });

      const { studentId, courseId } = enrollSchema.parse(req.body);
      const enrolledBy = req.currentUser?.id || req.session?.userId;

      // Verify student exists and has student role
      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'student') {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      // Verify course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if already enrolled
      const existingEnrollments = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId)
        ));

      if (existingEnrollments.length > 0) {
        return res.status(400).json({ message: "Student already enrolled in this course" });
      }

      // Create enrollment
      const enrollment = await storage.createEnrollment({
        studentId,
        courseId,
        enrolledBy,
      });

      // Log activity
      await ActivityLogger.logStudentEnrolled(
        enrolledBy,
        studentId,
        courseId,
        course.title,
        req
      );

      res.json({ 
        message: `Student ${student.username} enrolled in course "${course.title}"`,
        enrollment 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error enrolling student:", error);
      res.status(500).json({ message: "Failed to enroll student" });
    }
  });

  // Admin: Get all trainers
  app.get("/api/admin/trainers", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const trainers = allUsers.filter(u => u.role === 'trainer').map(u => {
        const { passwordHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(trainers);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      res.status(500).json({ message: "Failed to fetch trainers" });
    }
  });

  // Admin: Get all students
  app.get("/api/admin/students", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(u => u.role === 'student').map(u => {
        const { passwordHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ============ ENROLLMENT REQUEST ROUTES ============
  
  // Student: Create enrollment request
  app.post("/api/enrollment-requests", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const requestSchema = z.object({
        courseId: z.string(),
        message: z.string().optional(),
      });

      const { courseId, message } = requestSchema.parse(req.body);
      const studentId = req.currentUser.id;

      // Verify course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if already enrolled
      const existingEnrollments = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId)
        ));

      if (existingEnrollments.length > 0) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }

      // Check if request already exists
      const existingRequests = await db
        .select()
        .from(enrollmentRequests)
        .where(and(
          eq(enrollmentRequests.studentId, studentId),
          eq(enrollmentRequests.courseId, courseId),
          eq(enrollmentRequests.status, 'pending')
        ));

      if (existingRequests.length > 0) {
        return res.status(400).json({ message: "You already have a pending enrollment request for this course" });
      }

      // Create enrollment request
      const request = await storage.createEnrollmentRequest({
        studentId,
        courseId,
        message,
        status: 'pending',
      });
      
      // Log activity
      await ActivityLogger.logEnrollmentRequestCreated(studentId, request.id, course.title, req);

      res.json({ 
        message: `Enrollment request sent for "${course.title}"`,
        request 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating enrollment request:", error);
      res.status(500).json({ message: "Failed to create enrollment request" });
    }
  });

  // Admin/Sales: Get all enrollment requests
  app.get("/api/enrollment-requests", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const requests = await storage.getAllEnrollmentRequests();
      
      // Enrich with student and course data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const student = await storage.getUser(request.studentId);
          const course = await storage.getCourse(request.courseId);
          const reviewer = request.reviewedBy ? await storage.getUser(request.reviewedBy) : null;
          
          return {
            ...request,
            student: student ? { 
              id: student.id, 
              username: student.username, 
              email: student.email,
              firstName: student.firstName,
              lastName: student.lastName,
              phoneNumber: student.phoneNumber,
              profileImageUrl: student.profileImageUrl
            } : null,
            course: course ? { id: course.id, title: course.title } : null,
            reviewer: reviewer ? { id: reviewer.id, username: reviewer.username } : null,
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching enrollment requests:", error);
      res.status(500).json({ message: "Failed to fetch enrollment requests" });
    }
  });

  // Admin/Sales: Get pending enrollment requests
  app.get("/api/enrollment-requests/pending", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const requests = await storage.getPendingEnrollmentRequests();
      
      // Enrich with student and course data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const student = await storage.getUser(request.studentId);
          const course = await storage.getCourse(request.courseId);
          
          return {
            ...request,
            student: student ? { 
              id: student.id, 
              username: student.username, 
              email: student.email,
              firstName: student.firstName,
              lastName: student.lastName,
              phoneNumber: student.phoneNumber,
              profileImageUrl: student.profileImageUrl
            } : null,
            course: course ? { id: course.id, title: course.title } : null,
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching pending enrollment requests:", error);
      res.status(500).json({ message: "Failed to fetch pending enrollment requests" });
    }
  });

  // Student: Get my enrollment requests
  app.get("/api/my-enrollment-requests", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const requests = await storage.getEnrollmentRequestsByStudent(studentId);
      
      // Enrich with course data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const course = await storage.getCourse(request.courseId);
          const reviewer = request.reviewedBy ? await storage.getUser(request.reviewedBy) : null;
          
          return {
            ...request,
            course: course ? { id: course.id, title: course.title, category: course.category } : null,
            reviewer: reviewer ? { id: reviewer.id, username: reviewer.username } : null,
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching my enrollment requests:", error);
      res.status(500).json({ message: "Failed to fetch enrollment requests" });
    }
  });

  // Admin/Sales: Approve enrollment request
  app.post("/api/enrollment-requests/:id/approve", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const reviewerId = req.currentUser?.id || req.session?.userId;

      const request = await storage.approveEnrollmentRequest(id, reviewerId, reviewerId);
      
      // Log activity
      const course = await storage.getCourse(request.courseId);
      await ActivityLogger.logEnrollmentRequestApproved(
        reviewerId,
        request.studentId,
        id,
        course?.title || 'Unknown Course',
        req
      );
      
      res.json({ 
        message: "Enrollment request approved",
        request 
      });
    } catch (error) {
      console.error("Error approving enrollment request:", error);
      res.status(500).json({ message: "Failed to approve enrollment request" });
    }
  });

  // Admin/Sales: Reject enrollment request
  app.post("/api/enrollment-requests/:id/reject", isAuthenticated, requireRole(['admin', 'sales_consultant']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const reviewerId = req.currentUser?.id || req.session?.userId;

      const request = await storage.rejectEnrollmentRequest(id, reviewerId, message);
      
      // Log activity
      const course = await storage.getCourse(request.courseId);
      await ActivityLogger.logEnrollmentRequestRejected(
        reviewerId,
        request.studentId,
        id,
        course?.title || 'Unknown Course',
        req
      );
      
      res.json({ 
        message: "Enrollment request rejected",
        request 
      });
    } catch (error) {
      console.error("Error rejecting enrollment request:", error);
      res.status(500).json({ message: "Failed to reject enrollment request" });
    }
  });

  // Public (authenticated): Get courses by category
  app.get("/api/courses/category/:category", isAuthenticated, async (req: any, res) => {
    try {
      const { category } = req.params;
      const courses = await storage.getCoursesByCategory(category);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses by category:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // ============ POSTS ROUTES ============
  
  // Get approved posts (all authenticated users)
  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const approvedPosts = await storage.getApprovedPosts();
      
      const postsWithDetails = await Promise.all(
        approvedPosts.map(async (post) => {
          // Fetch fresh user data for post author
          const author = await storage.getUser(post.authorId);
          const comments = await storage.getCommentsByPost(post.id);
          const likes = await storage.getLikesByPost(post.id);
          const userLiked = likes.some(like => like.userId === req.session?.userId);
          
          const commentsWithAuthors = await Promise.all(
            comments.map(async (comment) => {
              // Fetch fresh user data for comment author
              const commentAuthor = await storage.getUser(comment.authorId);
              return {
                ...comment,
                authorName: `${commentAuthor?.firstName || ''} ${commentAuthor?.lastName || ''}`.trim() || commentAuthor?.username || 'Unknown',
                authorRole: commentAuthor?.role || 'student',
                authorProfileImage: commentAuthor?.profileImageUrl,
              };
            })
          );
          
          return {
            ...post,
            authorName: `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || author?.username || 'Unknown',
            authorRole: author?.role || 'student',
            authorProfileImage: author?.profileImageUrl,
            comments: commentsWithAuthors,
            likesCount: likes.length,
            userLiked,
          };
        })
      );
      
      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Upload post image
  app.post("/api/posts/upload-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Calculate expiration date (20 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 20);

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true,
        imageUrl,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      console.error("Error uploading image:", error);
      res.status(500).json({ success: false, message: "Failed to upload image" });
    }
  });

  // Create post (all authenticated users)
  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { content, imageUrl, imageExpiresAt } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!content && !imageUrl) {
        return res.status(400).json({ message: "Post must have content or image" });
      }
      
      const postData: any = {
        authorId: userId,
        content: content || null,
        imageUrl: imageUrl || null,
        status: 'pending'
      };
      
      // If image is uploaded, set expiration date
      if (imageUrl && imageExpiresAt) {
        postData.imageExpiresAt = new Date(imageExpiresAt);
      }
      
      const post = await storage.createPost(postData);
      
      // Log activity
      await ActivityLogger.logPostCreated(userId, post.id, req);
      
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Add comment to post (all authenticated users)
  app.post("/api/posts/:postId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const commentData = {
        ...req.body,
        postId,
        authorId: req.session?.userId,
      };
      
      const comment = await storage.createComment(commentData);
      
      // Log activity
      await ActivityLogger.logCommentCreated(req.session?.userId, comment.id, postId, req);
      
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Toggle like on post (all authenticated users)
  app.post("/api/posts/:postId/like", isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.toggleLike(postId, userId);
      
      // Log activity
      await ActivityLogger.logPostLiked(userId, postId, result.liked, req);
      
      res.json(result);
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Admin: Get pending posts
  app.get("/api/admin/posts/pending", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const pendingPosts = await storage.getPendingPosts();
      
      const postsWithAuthors = await Promise.all(
        pendingPosts.map(async (post) => {
          // Fetch fresh user data for post author
          const author = await storage.getUser(post.authorId);
          return {
            ...post,
            authorName: `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || author?.username || 'Unknown',
            authorRole: author?.role || 'student',
            authorProfileImage: author?.profileImageUrl,
          };
        })
      );
      
      res.json(postsWithAuthors);
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      res.status(500).json({ message: "Failed to fetch pending posts" });
    }
  });

  // Admin: Approve post
  app.patch("/api/admin/posts/:id/approve", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const approverId = req.session?.userId;
      
      if (!approverId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const approvedPost = await storage.approvePost(id, approverId);
      
      // Log activity
      await ActivityLogger.logPostApproved(approverId, approvedPost.authorId, id, req);
      
      res.json(approvedPost);
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({ message: "Failed to approve post" });
    }
  });

  // Admin: Reject post
  app.patch("/api/admin/posts/:id/reject", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const rejectedPost = await storage.rejectPost(id);
      
      // Log activity
      const rejectedBy = req.session?.userId;
      if (rejectedBy) {
        await ActivityLogger.logPostRejected(rejectedBy, rejectedPost.authorId, id, req);
      }
      
      res.json(rejectedPost);
    } catch (error) {
      console.error("Error rejecting post:", error);
      res.status(500).json({ message: "Failed to reject post" });
    }
  });

  // Admin: Cleanup expired post images
  app.post("/api/admin/posts/cleanup-images", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredPostImages();
      res.json({ 
        message: `Cleaned up ${deletedCount} expired post images`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error cleaning up expired post images:", error);
      res.status(500).json({ message: "Failed to cleanup expired images" });
    }
  });

  // ============ EMAIL TEST ROUTE ============
  
  // Test email configuration (admin only)
  app.post("/api/admin/test-email", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: "Test email address is required" });
      }
      
      // Test connection first
      const connectionTest = await emailService.testConnection();
      if (!connectionTest) {
        return res.status(500).json({ message: "SMTP connection failed" });
      }
      
      // Send test email
      await emailService.sendWelcomeEmail(
        testEmail,
        'Test',
        'User',
        'testuser',
        'temp123',
        'student'
      );
      
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email", error: error.message });
    }
  });
  
  // ============ PROFILE ROUTES ============
  
  // Upload profile image
  app.post("/api/profile/upload-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true,
        imageUrl
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      console.error("Error uploading profile image:", error);
      res.status(500).json({ success: false, message: "Failed to upload image" });
    }
  });

  // Update user profile
  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updateSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        profileImageUrl: z.string().optional(),
        education: z.array(z.object({
          degree: z.string(),
          institution: z.string(),
          year: z.string(),
          description: z.string().optional(),
        })).optional(),
        workExperience: z.array(z.object({
          position: z.string(),
          company: z.string(),
          duration: z.string(),
          description: z.string().optional(),
        })).optional(),
      });

      const updateData = updateSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      
      // Log activity
      await ActivityLogger.logProfileUpdated(userId, req);
      
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
