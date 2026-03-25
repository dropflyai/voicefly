#!/usr/bin/env npx tsx
/**
 * VoiceFly MCP Server v2
 *
 * Five-layer AI agent interface:
 *   HANDS  — Operations (create, manage, configure)
 *   EYES   — Awareness (metrics, health, product state)
 *   EARS   — Feedback (calls, messages, insights)
 *   MOUTH  — Communication (email, SMS, proposals)
 *   MEMORY — Context (interactions, learnings, playbooks)
 *
 * Direct access to Supabase, VAPI, Stripe, and Twilio.
 */

import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { handsTools, handleHandsTool } from './tools/hands.js'
import { eyesTools, handleEyesTool } from './tools/eyes.js'
import { earsTools, handleEarsTool } from './tools/ears.js'
import { mouthTools, handleMouthTool } from './tools/mouth.js'
import { memoryTools, handleMemoryTool } from './tools/memory.js'
import { conversionTools, handleConversionTool } from './tools/conversion.js'
import { campaignTools, handleCampaignTool } from './tools/campaigns.js'

// All tools
const allTools = [...handsTools, ...eyesTools, ...earsTools, ...mouthTools, ...memoryTools, ...conversionTools, ...campaignTools]

// Map tool names to their layer handler
const handlerMap: Record<string, (name: string, args: any) => Promise<string>> = {}
for (const t of handsTools) handlerMap[t.name] = handleHandsTool
for (const t of eyesTools) handlerMap[t.name] = handleEyesTool
for (const t of earsTools) handlerMap[t.name] = handleEarsTool
for (const t of mouthTools) handlerMap[t.name] = handleMouthTool
for (const t of memoryTools) handlerMap[t.name] = handleMemoryTool
for (const t of conversionTools) handlerMap[t.name] = handleConversionTool
for (const t of campaignTools) handlerMap[t.name] = handleCampaignTool

// Create server
const server = new Server(
  { name: 'voicefly', version: '4.0.0' },
  { capabilities: { tools: {} } }
)

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}))

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const handler = handlerMap[name]

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    }
  }

  try {
    const result = await handler(name, args)
    return {
      content: [{ type: 'text', text: result }],
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    }
  }
})

// Start
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('VoiceFly MCP Server v2 running (HANDS/EYES/EARS/MOUTH/MEMORY)')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
