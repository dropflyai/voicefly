/**
 * Phone Employees System
 *
 * AI-powered phone employees that can:
 * - Answer calls as receptionists
 * - Take orders for restaurants
 * - Manage schedules as personal assistants
 * - Take messages and handle callbacks
 */

// Core types
export * from './types'

// Action Executor
export { ActionExecutor, actionExecutor } from './action-executor'

// Task Scheduler
export { TaskScheduler, taskScheduler } from './task-scheduler'

// Message System
export { MessageSystem, messageSystem } from './message-system'

// Employee Provisioning
export { EmployeeProvisioningService, employeeProvisioning } from './employee-provisioning'

// Templates
export {
  createReceptionistEmployee,
  generateReceptionistPrompt,
  getDefaultReceptionistConfig,
  RECEPTIONIST_FUNCTIONS,
} from './templates/receptionist'

export {
  createPersonalAssistantEmployee,
  generatePersonalAssistantPrompt,
  getDefaultPersonalAssistantConfig,
  PERSONAL_ASSISTANT_FUNCTIONS,
} from './templates/personal-assistant'

export {
  createOrderTakerEmployee,
  generateOrderTakerPrompt,
  getDefaultOrderTakerConfig,
  ORDER_TAKER_FUNCTIONS,
  SAMPLE_RESTAURANT_MENU,
  SAMPLE_UPSELL_RULES,
} from './templates/order-taker'

export {
  createAfterHoursEmergencyEmployee,
  generateAfterHoursEmergencyPrompt,
  getDefaultAfterHoursEmergencyConfig,
  generateBusinessTypeSection,
  AFTER_HOURS_EMERGENCY_FUNCTIONS,
} from './templates/after-hours-emergency'

export {
  createRestaurantHostEmployee,
  generateRestaurantHostPrompt,
  getDefaultRestaurantHostConfig,
  RESTAURANT_HOST_FUNCTIONS,
} from './templates/restaurant-host'

export {
  createSurveyCallerEmployee,
  generateSurveyCallerPrompt,
  getDefaultSurveyCallerConfig,
  SURVEY_CALLER_FUNCTIONS,
} from './templates/survey-caller'

export {
  createLeadQualifierEmployee,
  generateLeadQualifierPrompt,
  getDefaultLeadQualifierConfig,
  LEAD_QUALIFIER_FUNCTIONS,
} from './templates/lead-qualifier'

export {
  createAppointmentReminderEmployee,
  generateAppointmentReminderPrompt,
  getDefaultAppointmentReminderConfig,
  APPOINTMENT_REMINDER_FUNCTIONS,
} from './templates/appointment-reminder'

export {
  createCollectionsEmployee,
  generateCollectionsPrompt,
  getDefaultCollectionsConfig,
  COLLECTIONS_FUNCTIONS,
} from './templates/collections'
