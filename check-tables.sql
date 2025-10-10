-- Check which tables exist and their columns
SELECT
    table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'package_services',
    'loyalty_tiers',
    'voice_ai_config',
    'subscription_invoices',
    'appointment_reminders',
    'phone_numbers',
    'staff_schedules',
    'voice_scripts',
    'call_recordings',
    'lead_enrichment',
    'email_templates',
    'follow_up_sequences',
    'meetings',
    'integrations',
    'webhooks',
    'team_performance',
    'custom_fields',
    'custom_field_values',
    'ai_training_feedback',
    'notification_preferences',
    'tags',
    'tag_associations',
    'call_queues',
    'ab_tests'
)
GROUP BY table_name
ORDER BY table_name;
