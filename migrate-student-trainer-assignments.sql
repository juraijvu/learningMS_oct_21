-- Create student_trainer_assignments table
CREATE TABLE IF NOT EXISTS student_trainer_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by VARCHAR NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_trainer_assignment_unique ON student_trainer_assignments(student_id, trainer_id, course_id);
CREATE INDEX IF NOT EXISTS idx_student_trainer_assignment_student ON student_trainer_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_trainer_assignment_trainer ON student_trainer_assignments(trainer_id);