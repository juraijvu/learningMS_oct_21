import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, verifyPassword } from "./auth";
import { insertCourseSchema, insertModuleSchema, insertEnrollmentSchema, insertTaskSchema, insertScheduleSchema, insertQuerySchema, insertUserSchema, insertTrainerAssignmentSchema, insertClassMaterialSchema, classMaterials } from "@shared/schema";
import { db } from "./db";
import { courses, modules, enrollments, users, trainerAssignments, moduleProgress, tasks, schedules, queries } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Role-based middleware
const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
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
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

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
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
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
      });
      
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.session.userId;
      
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
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

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

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
  app.post("/api/admin/users", isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const { password, ...userData } = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Admin: Assign trainer to course
  app.post("/api/admin/trainer-assignments", isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      // Add assignedBy from the current admin user
      const assignmentData = insertTrainerAssignmentSchema.parse({
        ...req.body,
        assignedBy: req.currentUser.id,
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
      const userId = req.currentUser.id;
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
      const trainerId = req.currentUser.id;
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
      const trainerId = req.currentUser.id;
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
      const studentId = req.currentUser.id;
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
      const studentId = req.currentUser.id;
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
      const studentId = req.currentUser.id;
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
      res.json(query);
    } catch (error) {
      console.error("Error creating query:", error);
      res.status(500).json({ message: "Failed to create query" });
    }
  });

  // Student: Get schedule
  app.get("/api/student/schedule", isAuthenticated, requireRole(['student']), async (req: any, res) => {
    try {
      const studentId = req.currentUser.id;
      const studentSchedules = await storage.getSchedulesByStudent(studentId);
      
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
          };
        })
      );

      res.json(schedulesWithDetails);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
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
      res.json(trainerTasks);
    } catch (error) {
      console.error("Error fetching trainer tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
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
      // Accept videos and documents
      const allowedTypes = [
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only videos and documents are allowed.'));
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
        expiresAt,
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
