-- Seed data for Nail Salon SaaS demo
-- This creates realistic demo data for testing and demonstrations

-- Clear existing data (be careful in production!)
truncate table voice_ai_calls cascade;
truncate table voice_ai_config cascade;
truncate table staff_schedules cascade;
truncate table business_hours cascade;
truncate table payments cascade;
truncate table appointments cascade;
truncate table customers cascade;
truncate table services cascade;
truncate table staff cascade;
truncate table businesses cascade;

-- Insert demo businesses
insert into businesses (id, name, slug, business_type, phone, email, address_line1, city, state, postal_code, subscription_tier, subscription_status) values
('550e8400-e29b-41d4-a716-446655440000', 'Bella Nails & Spa', 'bella-nails-spa', 'nail_salon', '(555) 123-4567', 'hello@bellanails.com', '123 Beauty Lane', 'Los Angeles', 'CA', '90210', 'professional', 'active'),
('550e8400-e29b-41d4-a716-446655440001', 'Glamour Nails Studio', 'glamour-nails-studio', 'nail_salon', '(555) 987-6543', 'info@glamournails.com', '456 Style Street', 'Beverly Hills', 'CA', '90212', 'enterprise', 'active');

-- Insert demo staff
insert into staff (business_id, email, first_name, last_name, phone, role, specialties, hourly_rate, commission_rate, hire_date) values
-- Bella Nails & Spa Staff
('550e8400-e29b-41d4-a716-446655440000', 'maya@bellanails.com', 'Maya', 'Rodriguez', '(555) 111-0001', 'manager', '["gel_manicure", "nail_art", "pedicure"]', 25.00, 0.15, '2023-01-15'),
('550e8400-e29b-41d4-a716-446655440000', 'sarah@bellanails.com', 'Sarah', 'Kim', '(555) 111-0002', 'technician', '["gel_manicure", "spa_pedicure"]', 22.00, 0.12, '2023-03-10'),
('550e8400-e29b-41d4-a716-446655440000', 'jessica@bellanails.com', 'Jessica', 'Chen', '(555) 111-0003', 'technician', '["nail_art", "gel_manicure", "dip_powder"]', 20.00, 0.10, '2023-06-01'),
('550e8400-e29b-41d4-a716-446655440000', 'alex@bellanails.com', 'Alex', 'Thompson', '(555) 111-0004', 'receptionist', '[]', 18.00, 0.00, '2023-08-15');

-- Insert demo services
insert into services (business_id, name, description, duration_minutes, base_price, category, requires_deposit, deposit_amount) values
-- Bella Nails & Spa Services
('550e8400-e29b-41d4-a716-446655440000', 'Classic Manicure', 'Traditional nail care with cuticle work and regular polish', 45, 35.00, 'manicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Gel Manicure', 'Long-lasting gel polish manicure with cuticle care', 60, 55.00, 'manicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Dip Powder Manicure', 'Durable dip powder system for strong, long-lasting nails', 75, 65.00, 'manicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Spa Pedicure', 'Relaxing foot soak, exfoliation, massage and polish', 75, 60.00, 'pedicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Gel Pedicure', 'Premium pedicure with long-lasting gel polish', 90, 75.00, 'pedicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Nail Art (Simple)', 'Basic nail art design on 2-3 nails', 30, 25.00, 'nail_art', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Nail Art (Detailed)', 'Complex nail art design on all nails', 60, 50.00, 'nail_art', true, 25.00),
('550e8400-e29b-41d4-a716-446655440000', 'Mani + Pedi Combo', 'Gel manicure and spa pedicure package deal', 150, 110.00, 'combo', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Express Manicure', 'Quick nail shaping and polish, no cuticle work', 30, 25.00, 'manicure', false, 0.00),
('550e8400-e29b-41d4-a716-446655440000', 'Nail Repair', 'Fix broken or damaged nails', 20, 15.00, 'repair', false, 0.00);

-- Insert demo customers
insert into customers (business_id, first_name, last_name, email, phone, total_visits, total_spent, last_visit_date, preferences) values
-- Bella Nails & Spa Customers
('550e8400-e29b-41d4-a716-446655440000', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 200-0001', 12, 720.00, '2024-01-15', '{"preferred_tech": "Maya", "allergies": [], "favorite_colors": ["nude", "pink"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Emily', 'Chen', 'emily.chen@email.com', '(555) 200-0002', 8, 480.00, '2024-01-10', '{"preferred_tech": "Jessica", "allergies": ["shellac"], "favorite_colors": ["red", "black"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Maria', 'Rodriguez', 'maria.rodriguez@email.com', '(555) 200-0003', 15, 1050.00, '2024-01-20', '{"preferred_tech": "Sarah", "allergies": [], "favorite_colors": ["coral", "gold"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Ashley', 'Williams', 'ashley.williams@email.com', '(555) 200-0004', 6, 390.00, '2024-01-08', '{"preferred_tech": "Maya", "allergies": ["acrylates"], "favorite_colors": ["purple", "blue"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Jessica', 'Davis', 'jessica.davis@email.com', '(555) 200-0005', 10, 650.00, '2024-01-18', '{"preferred_tech": "Jessica", "allergies": [], "favorite_colors": ["neutral", "beige"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Amanda', 'Miller', 'amanda.miller@email.com', '(555) 200-0006', 4, 240.00, '2024-01-05', '{"preferred_tech": "Sarah", "allergies": [], "favorite_colors": ["bright", "neon"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Lisa', 'Taylor', 'lisa.taylor@email.com', '(555) 200-0007', 18, 1260.00, '2024-01-22', '{"preferred_tech": "Maya", "allergies": [], "favorite_colors": ["classic", "french"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Rachel', 'Anderson', 'rachel.anderson@email.com', '(555) 200-0008', 7, 455.00, '2024-01-12', '{"preferred_tech": "Jessica", "allergies": ["formaldehyde"], "favorite_colors": ["pastels"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Nicole', 'Thomas', 'nicole.thomas@email.com', '(555) 200-0009', 5, 325.00, '2024-01-14', '{"preferred_tech": "Sarah", "allergies": [], "favorite_colors": ["metallic", "glitter"]}'),
('550e8400-e29b-41d4-a716-446655440000', 'Stephanie', 'Garcia', 'stephanie.garcia@email.com', '(555) 200-0010', 9, 585.00, '2024-01-16', '{"preferred_tech": "Maya", "allergies": [], "favorite_colors": ["dark", "gothic"]}');

-- Insert business hours (Mon-Sat 9AM-7PM, Sun 10AM-6PM)
insert into business_hours (business_id, day_of_week, is_open, open_time, close_time) values
('550e8400-e29b-41d4-a716-446655440000', 0, true, '10:00', '18:00'), -- Sunday
('550e8400-e29b-41d4-a716-446655440000', 1, true, '09:00', '19:00'), -- Monday
('550e8400-e29b-41d4-a716-446655440000', 2, true, '09:00', '19:00'), -- Tuesday
('550e8400-e29b-41d4-a716-446655440000', 3, true, '09:00', '19:00'), -- Wednesday
('550e8400-e29b-41d4-a716-446655440000', 4, true, '09:00', '19:00'), -- Thursday
('550e8400-e29b-41d4-a716-446655440000', 5, true, '09:00', '20:00'), -- Friday
('550e8400-e29b-41d4-a716-446655440000', 6, true, '08:00', '20:00'); -- Saturday

-- Get service and staff IDs for appointments
-- We'll create appointments for the past 30 days and next 7 days

-- Insert realistic appointments (mix of completed, upcoming, and cancelled)
do $$
declare
    business_uuid uuid := '550e8400-e29b-41d4-a716-446655440000';
    customer_ids uuid[];
    staff_ids uuid[];
    service_ids uuid[];
    service_data record;
    i integer;
    appointment_date date;
    start_hour integer;
    start_minute integer;
    customer_id uuid;
    staff_id uuid;
    service_id uuid;
    appointment_status appointment_status;
    payment_amount decimal(10,2);
begin
    -- Get arrays of IDs
    select array_agg(id) into customer_ids from customers where business_id = business_uuid;
    select array_agg(id) into staff_ids from staff where business_id = business_uuid and role in ('technician', 'manager');
    select array_agg(id) into service_ids from services where business_id = business_uuid;

    -- Create appointments for past 30 days and next 7 days
    for i in 0..36 loop
        -- Calculate date (30 days ago to 7 days from now)
        appointment_date := current_date - interval '30 days' + (i || ' days')::interval;
        
        -- Skip if it's a Monday (closed day in some scenarios)
        if extract(dow from appointment_date) != 1 then
            -- Create 3-8 appointments per day
            for j in 1..(3 + floor(random() * 6))::integer loop
                -- Random time between 9 AM and 6 PM
                start_hour := 9 + floor(random() * 10)::integer;
                start_minute := (floor(random() * 4) * 15)::integer; -- 0, 15, 30, or 45
                
                -- Random customer, staff, and service
                customer_id := customer_ids[1 + floor(random() * array_length(customer_ids, 1))::integer];
                staff_id := staff_ids[1 + floor(random() * array_length(staff_ids, 1))::integer];
                service_id := service_ids[1 + floor(random() * array_length(service_ids, 1))::integer];
                
                -- Get service details
                select duration_minutes, base_price into service_data 
                from services where id = service_id;
                
                -- Determine status based on date
                if appointment_date < current_date then
                    -- Past appointments - mostly completed, some no-shows/cancellations
                    case floor(random() * 10)::integer
                        when 0 then appointment_status := 'no_show';
                        when 1 then appointment_status := 'cancelled';
                        else appointment_status := 'completed';
                    end case;
                elsif appointment_date = current_date then
                    -- Today's appointments
                    if make_time(start_hour, start_minute, 0) < current_time then
                        appointment_status := 'completed';
                    else
                        appointment_status := 'confirmed';
                    end if;
                else
                    -- Future appointments
                    appointment_status := 'confirmed';
                end if;
                
                -- Insert appointment
                insert into appointments (
                    business_id, customer_id, staff_id, service_id,
                    appointment_date, start_time, end_time, status
                ) values (
                    business_uuid, customer_id, staff_id, service_id,
                    appointment_date,
                    make_time(start_hour, start_minute, 0),
                    make_time(start_hour, start_minute, 0) + (service_data.duration_minutes || ' minutes')::interval,
                    appointment_status
                );
                
                -- Create payment for completed appointments
                if appointment_status = 'completed' then
                    payment_amount := service_data.base_price + (random() * 20 - 10); -- Add some variation
                    payment_amount := greatest(payment_amount, service_data.base_price * 0.8); -- Minimum 80% of base price
                    
                    insert into payments (
                        business_id, appointment_id, customer_id,
                        amount, tip_amount, total_amount, payment_method, status, processed_at
                    ) values (
                        business_uuid, 
                        (select id from appointments where business_id = business_uuid 
                         and customer_id = customer_id and appointment_date = appointment_date 
                         and start_time = make_time(start_hour, start_minute, 0) limit 1),
                        customer_id,
                        payment_amount,
                        payment_amount * (random() * 0.25), -- 0-25% tip
                        payment_amount + (payment_amount * random() * 0.25),
                        case floor(random() * 4)::integer
                            when 0 then 'cash'
                            when 1 then 'credit_card'
                            when 2 then 'debit_card'
                            else 'mobile_payment'
                        end,
                        'paid',
                        appointment_date + make_time(start_hour, start_minute, 0) + (service_data.duration_minutes || ' minutes')::interval
                    );
                end if;
            end loop;
        end if;
    end loop;
end $$;

-- Insert Voice AI configuration
insert into voice_ai_config (business_id, is_enabled, phone_number, greeting_message, business_hours_message) values
('550e8400-e29b-41d4-a716-446655440000', true, '(555) AI-NAILS', 
 'Hello! Thank you for calling Bella Nails & Spa. I''m your AI assistant and I can help you book an appointment or answer questions about our services.',
 'We''re currently closed. Our hours are Monday through Friday 9 AM to 7 PM, Saturday 8 AM to 8 PM, and Sunday 10 AM to 6 PM. You can still book an appointment and I''ll confirm it when we''re open!');

-- Insert some Voice AI call logs
insert into voice_ai_calls (business_id, customer_phone, call_duration, call_outcome, transcript) values
('550e8400-e29b-41d4-a716-446655440000', '(555) 300-0001', 120, 'booking_made', 'Customer called to book a gel manicure appointment for next Tuesday at 2 PM with Maya.'),
('550e8400-e29b-41d4-a716-446655440000', '(555) 300-0002', 45, 'info_request', 'Customer asked about pricing for spa pedicure. Provided information and encouraged booking.'),
('550e8400-e29b-41d4-a716-446655440000', '(555) 300-0003', 180, 'booking_made', 'New customer booked mani-pedi combo for Saturday morning. Collected contact information.'),
('550e8400-e29b-41d4-a716-446655440000', '(555) 300-0004', 30, 'hang_up', 'Caller hung up after hearing AI greeting.'),
('550e8400-e29b-41d4-a716-446655440000', '(555) 300-0005', 90, 'rescheduled', 'Existing customer called to reschedule Thursday appointment to Friday.');

-- Update customer totals based on actual payments
update customers set 
    total_visits = (
        select count(*) 
        from appointments 
        where customer_id = customers.id and status = 'completed'
    ),
    total_spent = (
        select coalesce(sum(total_amount), 0) 
        from payments 
        where customer_id = customers.id and status = 'paid'
    ),
    last_visit_date = (
        select max(appointment_date)
        from appointments 
        where customer_id = customers.id and status = 'completed'
    );

-- Create staff schedules (all staff work Tue-Sat, Maya also works Sunday)
do $$
declare
    staff_record record;
begin
    for staff_record in select id from staff where business_id = '550e8400-e29b-41d4-a716-446655440000' loop
        -- Tuesday through Saturday for all staff
        for day_num in 2..6 loop
            insert into staff_schedules (business_id, staff_id, day_of_week, is_available, start_time, end_time) values
            ('550e8400-e29b-41d4-a716-446655440000', staff_record.id, day_num, true, '09:00', '19:00');
        end loop;
        
        -- Maya (manager) also works Sunday
        if staff_record.id = (select id from staff where email = 'maya@bellanails.com' limit 1) then
            insert into staff_schedules (business_id, staff_id, day_of_week, is_available, start_time, end_time) values
            ('550e8400-e29b-41d4-a716-446655440000', staff_record.id, 0, true, '10:00', '18:00');
        end if;
    end loop;
end $$;