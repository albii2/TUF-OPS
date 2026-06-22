exports.up = async (pgm) => {
  pgm.sql(`
    DELETE FROM training_modules;

    INSERT INTO training_modules (title, description, role, phase, order_index, content_markdown, estimated_duration_minutes, module_type, quiz_json, passing_score, created_at, updated_at) VALUES
    (
      'Combine Phase 1: The Scout',
      'Map your territory and locate decision-makers.',
      'REP',
      'LEVEL_1_OPERATOR',
      1,
      '## Phase Overview\nThe Scout phase is about understanding your geography. You must map your territory and identify the decision-makers at each school before making any outbound outreach.\n\n## Software Objective\n- Navigate the Territory Command Map.\n- Locate your assigned schools.\n\n## Field Mission\n- Identify 3 assigned schools in your territory.\n- Look up the Athletic Director and head Football coach name for each school (via school directory or athletic website).\n- Create contact profiles and log them inside TUF Ops.\n\n## Success Criteria\n- 3 target schools mapped\n- 3 Athletic Director contacts created\n- 3 head Football coach contacts created\n',
      30,
      'MODULE',
      '[{"question": "What is the primary objective of Phase 1 (The Scout)?", "options": ["Pitch uniforms to coaches immediately", "Map your territory and identify Athletic Directors and head coaches", "Set up a team fan store storefront", "Submit a custom design mockup request"], "correctAnswer": "Map your territory and identify Athletic Directors and head coaches"}]'::jsonb,
      85,
      NOW(),
      NOW()
    ),
    (
      'Combine Phase 2: The Playmaker',
      'Handle initial objections and deliver product sample kits.',
      'REP',
      'LEVEL_2_PRODUCT',
      2,
      '## Phase Overview\nThe Playmaker phase is about introducing the TUF value proposition and handling the common "We already have a vendor" objection.\n\n## Software Objective\n- Practice objection handling in the Locker Room Simulator.\n- Log telephone and email touches.\n\n## Field Mission\n- Call or visit an AD or coach and introduce the TUF standard.\n- Drop off a physical sample kit.\n\n## Success Criteria\n- Locker Room Simulator objection scenario passed\n- Contact touch logged in the CRM\n- Opportunity configured with target sport and roster size\n',
      30,
      'INTERACTIVE',
      '[{"question": "How should you respond when a prospect says they already have a vendor?", "options": ["Tell them their current vendor is terrible", "Ask a diagnostic question to uncover service or timing friction points", "Offer an instant 30% discount", "End the call immediately"], "correctAnswer": "Ask a diagnostic question to uncover service or timing friction points"}]'::jsonb,
      85,
      NOW(),
      NOW()
    ),
    (
      'Combine Phase 3: The Closer',
      'Convert coach interest into active uniform mockup requests.',
      'REP',
      'LEVEL_3_TERRITORY',
      3,
      '## Phase Overview\nThe Closer phase is about securing design interest. Visualizing a team''s colors on custom uniforms is the highest-converting sales trigger.\n\n## Software Objective\n- Create uniform opportunities and configure estimated deal values.\n- Upload artwork and logo assets.\n\n## Field Mission\n- Secure team logo assets and color requirements from a coach.\n- Submit a uniform mockup request to the design desk.\n\n## Success Criteria\n- Opportunity moved to "Design the Win" stage\n- Roster sizes and deadline dates populated\n- Team logo files uploaded\n',
      30,
      'HANDS_ON',
      '[{"question": "What is the key action needed to move a deal to the Design the Win stage?", "options": ["Close the deal as won", "Upload the team''s logo assets and submit a mockup request", "Generate a pricing quote", "Launch a team store storefront"], "correctAnswer": "Upload the team''s logo assets and submit a mockup request"}]'::jsonb,
      85,
      NOW(),
      NOW()
    ),
    (
      'Combine Phase 4: Game Day',
      'Launch fan stores, configure packs, and process paid orders.',
      'REP',
      'LEVEL_4_SALES',
      4,
      '## Phase Overview\nGame Day is when pipeline turns into paid revenue. You will launch team stores, player packs, and capture orders.\n\n## Software Objective\n- Build and launch a team store link.\n- Process a paid order.\n\n## Field Mission\n- Secure approval for a fan store or parent player pack.\n- Drive initial store orders from players and parents.\n\n## Success Criteria\n- Team store storefront launched in TUF Ops\n- First paid order processed\n- First commission payout generated\n',
      30,
      'MODULE',
      '[{"question": "When is commission considered payable for an order in TUF Ops?", "options": ["When the coach verbally agrees to buy", "When the order is processed and paid/fulfilled", "When the mockup is approved", "When the opportunity is created"], "correctAnswer": "When the order is processed and paid/fulfilled"}]'::jsonb,
      85,
      NOW(),
      NOW()
    );
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DELETE FROM training_modules WHERE title IN (
      'Combine Phase 1: The Scout',
      'Combine Phase 2: The Playmaker',
      'Combine Phase 3: The Closer',
      'Combine Phase 4: Game Day'
    );
  `);
};
