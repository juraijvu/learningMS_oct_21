-- Create module completion requests table
CREATE TABLE IF NOT EXISTS module_completion_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id VARCHAR NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_completion_requests_student ON module_completion_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_module_completion_requests_status ON module_completion_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);