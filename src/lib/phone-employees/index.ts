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
