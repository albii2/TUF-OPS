CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'sales_rep'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    zoho_owner_id VARCHAR(255)
);

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    zoho_account_id VARCHAR(255)
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    zoho_contact_id VARCHAR(255)
);

CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id),
    team_id INT REFERENCES teams(id),
    name VARCHAR(255) NOT NULL,
    channel_type VARCHAR(50) NOT NULL DEFAULT 'UNIFORM', -- UNIFORM, TRAVEL_GEAR, TEAM_STORE, LETTERMAN
    stage VARCHAR(50) NOT NULL, -- Prospect, Engage, Design the Win, etc.
    last_contact_date TIMESTAMPTZ,
    next_action_date TIMESTAMPTZ,
    probability INT, -- 0-100
    estimated_value NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    zoho_deal_id VARCHAR(255),
    CONSTRAINT opportunities_organization_id_channel_type_key UNIQUE (organization_id, channel_type)
);

CREATE TABLE opportunity_notes (
    id SERIAL PRIMARY KEY,
    opportunity_id INT REFERENCES opportunities(id),
    user_id INT REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rep_activities (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    opportunity_id INT REFERENCES opportunities(id),
    activity_type VARCHAR(50) NOT NULL, -- e.g., 'call', 'email', 'meeting'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mockups (
    id SERIAL PRIMARY KEY,
    opportunity_id INT REFERENCES opportunities(id),
    status VARCHAR(50), -- e.g., 'Requested', 'In Design', 'Approved'
    team_colors TEXT,
    logo_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mockup_versions (
    id SERIAL PRIMARY KEY,
    mockup_id INT REFERENCES mockups(id),
    version_number INT NOT NULL,
    image_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_assets (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    asset_type VARCHAR(50), -- e.g., 'logo', 'color_palette'
    asset_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sample_requests (
    id SERIAL PRIMARY KEY,
    opportunity_id INT REFERENCES opportunities(id),
    status VARCHAR(50), -- e.g., 'Requested', 'Invoice Sent', 'Paid'
    notes TEXT,
    invoice_id INT, -- Will link to invoices table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_master (
    id SERIAL PRIMARY KEY,
    base_sku VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sport VARCHAR(100),
    decoration VARCHAR(100),
    set_type VARCHAR(100),
    vendor VARCHAR(100),
    vendor_cost NUMERIC(10, 2),
    retail_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uniform_orders (
    id SERIAL PRIMARY KEY,
    opportunity_id INT REFERENCES opportunities(id),
    status VARCHAR(50), -- e.g., 'Not Sent', 'Sent', 'Received', 'Processed'
    estimated_revenue NUMERIC(10, 2),
    vendor_cost NUMERIC(10, 2),
    gross_profit NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uniform_order_lines (
    id SERIAL PRIMARY KEY,
    uniform_order_id INT REFERENCES uniform_orders(id),
    product_id INT REFERENCES product_master(id),
    quantity INT NOT NULL,
    price_per_unit NUMERIC(10, 2),
    total_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster_uploads (
    id SERIAL PRIMARY KEY,
    uniform_order_id INT REFERENCES uniform_orders(id),
    file_url VARCHAR(255) NOT NULL,
    status VARCHAR(50), -- e.g., 'Uploaded', 'Processing', 'Completed', 'Error'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster_rows (
    id SERIAL PRIMARY KEY,
    roster_upload_id INT REFERENCES roster_uploads(id),
    data JSONB, -- Store the raw row data
    is_valid BOOLEAN DEFAULT FALSE,
    validation_errors TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders_raw (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- e.g., 'ecwid', 'manual'
    data JSONB, -- Raw order data from the source
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    raw_order_id INT REFERENCES orders_raw(id),
    customer_email VARCHAR(255),
    total_price NUMERIC(10, 2),
    order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    sku VARCHAR(100),
    product_name VARCHAR(255),
    quantity INT NOT NULL,
    price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    opportunity_id INT REFERENCES opportunities(id),
    open_date TIMESTAMPTZ,
    close_date TIMESTAMPTZ,
    store_type VARCHAR(50), -- e.g., 'upsell', 'standalone', 'fundraiser'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_product_pricing (
    id SERIAL PRIMARY KEY,
    team_store_id INT REFERENCES team_stores(id),
    product_id INT REFERENCES product_master(id),
    vendor_cost NUMERIC(10, 2),
    tuf_retail_floor NUMERIC(10, 2),
    public_sale_price NUMERIC(10, 2),
    team_payout_above_floor NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fundraising_payouts (
    id SERIAL PRIMARY KEY,
    team_store_id INT REFERENCES team_stores(id),
    total_payout NUMERIC(10, 2),
    paid_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    -- To be defined further based on accounting needs
    -- For now, it will be linked from sample_requests
    amount NUMERIC(10, 2),
    status VARCHAR(50), -- e.g., 'draft', 'sent', 'paid'
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    -- To be defined further based on document generation needs
    file_name VARCHAR(255),
    file_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
