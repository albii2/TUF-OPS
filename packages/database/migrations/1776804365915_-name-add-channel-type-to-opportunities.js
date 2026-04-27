
exports.up = async (pgm) => { 
  pgm.sql(` 
    ALTER TABLE opportunities 
    ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50); 
  `); 

  pgm.sql(` 
    UPDATE opportunities 
    SET channel_type = 'UNIFORM' 
    WHERE channel_type IS NULL; 
  `); 

  pgm.sql(` 
    ALTER TABLE opportunities 
    ALTER COLUMN channel_type SET DEFAULT 'UNIFORM', 
    ALTER COLUMN channel_type SET NOT NULL; 
  `); 

  pgm.sql(` 
    DO $$ 
    BEGIN 
      IF NOT EXISTS ( 
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'opportunities_channel_type_allowed' 
      ) THEN 
        ALTER TABLE opportunities 
        ADD CONSTRAINT opportunities_channel_type_allowed 
        CHECK (channel_type IN ('UNIFORM','TRAVEL_GEAR','TEAM_STORE','LETTERMAN')); 
      END IF; 
    END 
    $$; 
  `); 
}; 

exports.down = async () => { 
  // no destructive rollback 
}; 
