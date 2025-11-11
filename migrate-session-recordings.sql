-- Create session recordings table
CREATE TABLE IF NOT EXISTS session_recordings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id VARCHAR NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    trainer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    duration INTEGER, -- in seconds
    uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create session recording shares table
CREATE TABLE IF NOT EXISTS session_recording_shares (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id VARCHAR NOT NULL REFERENCES session_recordings(id) ON DELETE CASCADE,
    student_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(recording_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_recordings_trainer ON session_recordings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_schedule ON session_recordings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_session_recording_shares_unique ON session_recording_shares(recording_id, student_id);
CREATE INDEX IF NOT EXISTS idx_session_recording_shares_student ON session_recording_shares(student_id);