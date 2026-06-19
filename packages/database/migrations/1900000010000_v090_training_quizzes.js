const quiz = (title, question, correct, options) => `('${title.replace(/'/g, "''")}', '${JSON.stringify([{ question, options, correctAnswer: correct }]).replace(/'/g, "''")}')`;

exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.training_modules') IS NOT NULL THEN
        ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS quiz_json jsonb;
        ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 85;
        ALTER TABLE training_modules DROP CONSTRAINT IF EXISTS training_modules_passing_score_check;
        ALTER TABLE training_modules ADD CONSTRAINT training_modules_passing_score_check CHECK (passing_score IS NULL OR (passing_score >= 0 AND passing_score <= 100));

        WITH incoming(title, quiz_json) AS (VALUES
          ${[
            quiz('Welcome to TUF Sports Apparel','What is the rep\'s job on a first TUF conversation?','Diagnose the program need and create a logged next step',['Dump a catalog','Diagnose the program need and create a logged next step','Promise a discount','Skip CRM notes']),
            quiz('Rep Expectations: 4 Orders Per Month','What activity standard supports four orders per month?','Daily touches, clean follow-up, and enough real pipeline coverage',['Waiting for inbound leads','Daily touches, clean follow-up, and enough real pipeline coverage','Only calling closed-won accounts','Avoiding director review']),
            quiz('How Certification Unlocks CRM Access','What unlocks live CRM access for reps?','Modules/quizzes, HR docs, practical exercise, and director sign-off',['A manager text only','Modules/quizzes, HR docs, practical exercise, and director sign-off','One demo login','Assignment to a territory only']),
            quiz('Uniforms: TUF SHIFT, TUF GRIND, TUF OVERTIME, TUF FLEX','What must a uniform opportunity capture before mockup/sample?','Sport, roster, deadline, artwork, buyer, and approval path',['Only school colors','Sport, roster, deadline, artwork, buyer, and approval path','A guessed price','No next action']),
            quiz('Team Stores','What makes a team store pitch qualified?','Audience, product mix, launch timing, and promotion owner',['A random link','Audience, product mix, launch timing, and promotion owner','No buyer named','Only a logo']),
            quiz('Understanding Assigned Schools','When is a school counted as touched?','When an auditable activity/contact/opportunity touch is logged',['When it is assigned','When it appears in a list','When an auditable activity/contact/opportunity touch is logged','When a rep thinks about it']),
            quiz('Discovery Call Framework','What is discovery for?','Finding pain, timing, authority, budget range, needs, and next step',['Reading a product list','Finding pain, timing, authority, budget range, needs, and next step','Arguing with vendors','Skipping qualification']),
            quiz('Handling “We Already Have a Vendor”','How should reps handle the vendor objection?','Respect it and find the current friction/gap',['Attack the vendor','Respect it and find the current friction/gap','End the call','Offer an immediate discount']),
            quiz('Orders After Closed Won','When does commission become payable?','After payment/fulfillment-gated order status such as delivered/completed',['At verbal interest','On draft invoice','After payment/fulfillment-gated order status such as delivered/completed','When a mockup is requested']),
            quiz('Director Certification Review','What should directors verify before sign-off?','Modules/quizzes, HR docs, practical exercise, CRM discipline, and readiness',['Only login access','Modules/quizzes, HR docs, practical exercise, CRM discipline, and readiness','A single phone call','Assignment count only'])
          ].join(',\n          ')}
        )
        UPDATE training_modules tm
        SET quiz_json = incoming.quiz_json::jsonb,
            passing_score = 85,
            updated_at = NOW()
        FROM incoming
        WHERE tm.title = incoming.title;
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.training_modules') IS NOT NULL THEN
        ALTER TABLE training_modules DROP CONSTRAINT IF EXISTS training_modules_passing_score_check;
        ALTER TABLE training_modules DROP COLUMN IF EXISTS passing_score;
        ALTER TABLE training_modules DROP COLUMN IF EXISTS quiz_json;
      END IF;
    END $$;
  `);
};
