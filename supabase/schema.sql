-- Nail Salon SaaS Database Schema
-- This creates all the tables needed for a complete nail salon management system

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Phone numbers table for Vapi integration
create table phone_numbers (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    phone_number varchar(20) not null,
    vapi_phone_id varchar(255), -- Vapi's phone number ID
    vapi_phone_number_id varchar(255), -- Alternative ID field
    is_primary boolean default false,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create custom types
create type subscription_tier as enum ('starter', 'professional', 'enterprise');
create type subscription_status as enum ('active', 'cancelled', 'past_due', 'trialing');
create type appointment_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type payment_status as enum ('pending', 'paid', 'partially_paid', 'refunded', 'failed');
create type staff_role as enum ('owner', 'manager', 'technician', 'receptionist');

-- Businesses table (multi-tenant support)
create table businesses (
    id uuid default uuid_generate_v4() primary key,
    name varchar(255) not null,
    slug varchar(100) unique not null,
    business_type varchar(50) default 'nail_salon',
    phone varchar(20),
    email varchar(255),
    website varchar(255),
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(100),
    state varchar(50),
    postal_code varchar(20),
    country varchar(100) default 'US',
    timezone varchar(50) default 'America/Los_Angeles',
    subscription_tier subscription_tier default 'starter',
    subscription_status subscription_status default 'trialing',
    trial_ends_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Staff/Users table
create table staff (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    email varchar(255) unique not null,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    phone varchar(20),
    role staff_role default 'technician',
    specialties text[], -- Array of service specialties
    hourly_rate decimal(10,2),
    commission_rate decimal(5,2) default 0.00, -- Percentage as decimal (e.g., 0.15 = 15%)
    is_active boolean default true,
    hire_date date,
    avatar_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Services table
create table services (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    name varchar(255) not null,
    description text,
    duration_minutes integer not null, -- Duration in minutes
    base_price decimal(10,2) not null,
    category varchar(100), -- 'manicure', 'pedicure', 'nail_art', etc.
    is_active boolean default true,
    requires_deposit boolean default false,
    deposit_amount decimal(10,2) default 0.00,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Customers table
create table customers (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(255),
    phone varchar(20) not null,
    date_of_birth date,
    notes text,
    preferences jsonb, -- Store customer preferences as JSON
    total_visits integer default 0,
    total_spent decimal(10,2) default 0.00,
    last_visit_date date,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    -- Create unique constraint on business_id + phone
    unique(business_id, phone)
);

-- Appointments table
create table appointments (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    customer_id uuid references customers(id) on delete cascade,
    staff_id uuid references staff(id) on delete set null,
    service_id uuid references services(id) on delete cascade,
    appointment_date date not null,
    start_time time not null,
    end_time time not null,
    status appointment_status default 'pending',
    notes text,
    internal_notes text, -- Staff-only notes
    reminder_sent boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Payments table
create table payments (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    appointment_id uuid references appointments(id) on delete cascade,
    customer_id uuid references customers(id) on delete cascade,
    amount decimal(10,2) not null,
    tip_amount decimal(10,2) default 0.00,
    tax_amount decimal(10,2) default 0.00,
    total_amount decimal(10,2) not null,
    payment_method varchar(50), -- 'cash', 'card', 'venmo', etc.
    status payment_status default 'pending',
    stripe_payment_intent_id varchar(255),
    processed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Business hours table
create table business_hours (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    day_of_week integer not null, -- 0 = Sunday, 1 = Monday, etc.
    is_open boolean default true,
    open_time time,
    close_time time,
    break_start_time time, -- Optional lunch break
    break_end_time time,
    created_at timestamp with time zone default now(),
    
    -- Ensure one record per business per day
    unique(business_id, day_of_week)
);

-- Staff availability/schedules
create table staff_schedules (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    staff_id uuid references staff(id) on delete cascade,
    day_of_week integer not null,
    is_available boolean default true,
    start_time time,
    end_time time,
    break_start_time time,
    break_end_time time,
    created_at timestamp with time zone default now(),
    
    unique(staff_id, day_of_week)
);

-- Voice AI configuration
create table voice_ai_config (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    is_enabled boolean default false,
    vapi_assistant_id varchar(255),
    phone_number varchar(20),
    greeting_message text,
    business_hours_message text,
    booking_confirmation_message text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Voice AI call logs
create table voice_ai_calls (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    vapi_call_id varchar(255) unique,
    customer_phone varchar(20),
    call_duration integer, -- Duration in seconds
    call_outcome varchar(100), -- 'booking_made', 'info_request', 'hang_up', etc.
    appointment_id uuid references appointments(id) on delete set null,
    transcript text,
    created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index idx_appointments_date on appointments(appointment_date);
create index idx_appointments_staff on appointments(staff_id);
create index idx_appointments_customer on appointments(customer_id);
create index idx_appointments_business on appointments(business_id);
create index idx_customers_business on customers(business_id);
create index idx_customers_phone on customers(phone);
create index idx_staff_business on staff(business_id);
create index idx_services_business on services(business_id);
create index idx_payments_appointment on payments(appointment_id);

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_businesses_updated_at before update on businesses
    for each row execute function update_updated_at_column();

create trigger update_staff_updated_at before update on staff
    for each row execute function update_updated_at_column();

create trigger update_services_updated_at before update on services
    for each row execute function update_updated_at_column();

create trigger update_customers_updated_at before update on customers
    for each row execute function update_updated_at_column();

create trigger update_appointments_updated_at before update on appointments
    for each row execute function update_updated_at_column();

create trigger update_payments_updated_at before update on payments
    for each row execute function update_updated_at_column();

create trigger update_voice_ai_config_updated_at before update on voice_ai_config
    for each row execute function update_updated_at_column();