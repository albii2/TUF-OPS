exports.up = (pgm) => {
  // TAE (Sales Rep) Curriculum
  pgm.sql(`
    INSERT INTO training_modules (title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type, created_at, updated_at)
    VALUES
    -- Day 1 Phase
    ('Welcome to TUF Sports Apparel', 'Introduction to the company, mission, and core values', 'TAE', 'DAY_1', 1, '# Welcome to TUF\n\nWelcome to the TUF Sports Apparel family! This module introduces you to our company mission and core values.', 15, 'MODULE', NOW(), NOW()),
    ('The TUF Ops System', 'Overview of the TUF Ops platform and how sales reps interact with it daily', 'TAE', 'DAY_1', 2, '# TUF Ops System\n\nLearn how to navigate the TUF Ops application. This is your primary tool for managing opportunities and customer relationships.', 30, 'INTERACTIVE', NOW(), NOW()),
    ('Product Overview', 'Understanding our product catalog: uniforms, travel gear, team stores, and letterman items', 'TAE', 'DAY_1', 3, '# Product Categories\n\n- **Uniforms**: Full team apparel packages\n- **Travel Gear**: Team travel wear and accessories\n- **Team Stores**: Custom retail shops for fundraising\n- **Letterman**: Premium athletic jackets', 20, 'MODULE', NOW(), NOW()),

    -- Day 1-2 Phase
    ('Discovery Call Framework', 'How to conduct discovery calls and ask the right questions', 'TAE', 'DAY_1_2', 1, '# Discovery Call Best Practices\n\n1. Ask about team size and structure\n2. Understand their current uniform situation\n3. Identify budget and timeline', 25, 'HANDS_ON', NOW(), NOW()),
    ('Proposal and Pricing', 'Understanding our pricing model and how to create winning proposals', 'TAE', 'DAY_1_2', 2, '# Pricing Strategy\n\nOur three-tier pricing model ensures competitiveness while maintaining margins.', 20, 'MODULE', NOW(), NOW()),
    ('Handling Objections', 'Common objections and proven strategies to overcome them', 'TAE', 'DAY_1_2', 3, '# Objection Handling\n\n- "Your prices are too high" → Show value proposition and ROI\n- "We already have a vendor" → Demonstrate competitive advantages', 30, 'INTERACTIVE', NOW(), NOW()),

    -- Week 1-2 Phase
    ('CRM Best Practices', 'How to maintain accurate records in TUF Ops for better forecasting', 'TAE', 'WEEK_1_2', 1, '# CRM Data Entry\n\nAccurate data entry is critical for team visibility and forecasting accuracy.', 20, 'MODULE', NOW(), NOW()),
    ('Pipeline Management', 'Managing your opportunity pipeline and staying on track with targets', 'TAE', 'WEEK_1_2', 2, '# Pipeline Stages\n\nUnderstand each stage: Lead → Discovery → Proposal → Negotiation → Closed Won/Lost', 25, 'INTERACTIVE', NOW(), NOW()),

    -- Month 1 Phase
    ('Advanced Negotiation Tactics', 'Techniques for negotiating complex deals and larger contracts', 'TAE', 'MONTH_1', 1, '# Win-Win Negotiation\n\nFocus on finding solutions that work for both parties.', 30, 'HANDS_ON', NOW(), NOW());
  `);

  // Director Curriculum
  pgm.sql(`
    INSERT INTO training_modules (title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type, created_at, updated_at)
    VALUES
    -- Day 1 Phase
    ('Director Welcome and Strategy Overview', 'Introduction to leadership role and strategic objectives for the quarter', 'DIRECTOR', 'DAY_1', 1, '# Director Role and Responsibilities\n\nAs a director, you lead your team toward quarterly and annual targets.', 20, 'MODULE', NOW(), NOW()),
    ('Team Management in TUF Ops', 'How to manage team members and monitor their performance through the system', 'DIRECTOR', 'DAY_1', 2, '# Team Management\n\nTrack your TAE team''s activities and guide them toward success.', 25, 'INTERACTIVE', NOW(), NOW()),

    -- Day 1-2 Phase
    ('Coaching Your Sales Reps', 'Best practices for coaching and developing your team members', 'DIRECTOR', 'DAY_1_2', 1, '# Sales Coaching Framework\n\nEffective coaching improves rep performance and retention.', 30, 'HANDS_ON', NOW(), NOW()),
    ('Forecasting and Pipeline Reviews', 'How to forecast accurately and conduct effective pipeline reviews', 'DIRECTOR', 'DAY_1_2', 2, '# Forecasting Methodology\n\nWeekly pipeline reviews keep the team aligned.', 25, 'MODULE', NOW(), NOW()),

    -- Week 1-2 Phase
    ('Performance Management', 'Setting goals, measuring performance, and conducting feedback sessions', 'DIRECTOR', 'WEEK_1_2', 1, '# Goal Setting and Reviews\n\nClear goals and regular feedback drive accountability and growth.', 30, 'INTERACTIVE', NOW(), NOW()),

    -- Month 1 Phase
    ('Strategic Planning and Scaling', 'Building a sustainable sales machine and scaling your territory', 'DIRECTOR', 'MONTH_1', 1, '# Growth Strategy\n\nMove from surviving to thriving through strategic planning.', 35, 'HANDS_ON', NOW(), NOW());
  `);

  // Admin Curriculum
  pgm.sql(`
    INSERT INTO training_modules (title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type, created_at, updated_at)
    VALUES
    -- Day 1 Phase
    ('Admin System Overview', 'Introduction to admin tools and system architecture', 'ADMIN', 'DAY_1', 1, '# System Architecture\n\nUnderstand how TUF Ops is structured and how different modules integrate.', 25, 'MODULE', NOW(), NOW()),
    ('User and Role Management', 'How to create users, assign roles, and manage permissions', 'ADMIN', 'DAY_1', 2, '# User Administration\n\nManage access control and ensure users have appropriate permissions.', 30, 'INTERACTIVE', NOW(), NOW()),

    -- Day 1-2 Phase
    ('Database Maintenance and Backups', 'System maintenance, backups, and data integrity', 'ADMIN', 'DAY_1_2', 1, '# Maintenance Procedures\n\nKeep the system running smoothly with regular maintenance.', 25, 'MODULE', NOW(), NOW()),

    -- Week 1-2 Phase
    ('Reporting and Analytics', 'How to create reports and analyze business data', 'ADMIN', 'WEEK_1_2', 1, '# Analytics Tools\n\nExtract insights from your business data.', 30, 'INTERACTIVE', NOW(), NOW());
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM training_modules`);
};
