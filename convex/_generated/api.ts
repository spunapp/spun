/* eslint-disable */
/**
 * Generated API references — will be replaced by `npx convex dev`
 *
 * Uses makeFunctionReference to create proper Convex function references.
 */

import { makeFunctionReference } from "convex/server"

export const api = {
  conversations: {
    list: makeFunctionReference<"query">("conversations:list"),
    get: makeFunctionReference<"query">("conversations:get"),
    getMessages: makeFunctionReference<"query">("conversations:getMessages"),
    create: makeFunctionReference<"mutation">("conversations:create"),
    updateTitle: makeFunctionReference<"mutation">("conversations:updateTitle"),
  },
  messages: {
    send: makeFunctionReference<"mutation">("messages:send"),
    updateMetadata: makeFunctionReference<"mutation">("messages:updateMetadata"),
    getByConversation: makeFunctionReference<"query">("messages:getByConversation"),
  },
  businesses: {
    get: makeFunctionReference<"query">("businesses:get"),
    getByUser: makeFunctionReference<"query">("businesses:getByUser"),
    create: makeFunctionReference<"mutation">("businesses:create"),
    update: makeFunctionReference<"mutation">("businesses:update"),
    updateTrustMode: makeFunctionReference<"mutation">("businesses:updateTrustMode"),
  },
  campaigns: {
    listByBusiness: makeFunctionReference<"query">("campaigns:listByBusiness"),
    get: makeFunctionReference<"query">("campaigns:get"),
    create: makeFunctionReference<"mutation">("campaigns:create"),
    updateStatus: makeFunctionReference<"mutation">("campaigns:updateStatus"),
  },
  approvals: {
    listPending: makeFunctionReference<"query">("approvals:listPending"),
    create: makeFunctionReference<"mutation">("approvals:create"),
    approve: makeFunctionReference<"mutation">("approvals:approve"),
    reject: makeFunctionReference<"mutation">("approvals:reject"),
  },
  usage: {
    getCurrentUsage: makeFunctionReference<"query">("usage:getCurrentUsage"),
    getOrCreateLedger: makeFunctionReference<"mutation">("usage:getOrCreateLedger"),
    incrementCampaigns: makeFunctionReference<"mutation">("usage:incrementCampaigns"),
    incrementCreatives: makeFunctionReference<"mutation">("usage:incrementCreatives"),
    incrementChannels: makeFunctionReference<"mutation">("usage:incrementChannels"),
  },
  channels: {
    listByBusiness: makeFunctionReference<"query">("channels:listByBusiness"),
    connect: makeFunctionReference<"mutation">("channels:connect"),
    disconnect: makeFunctionReference<"mutation">("channels:disconnect"),
    updateStatus: makeFunctionReference<"mutation">("channels:updateStatus"),
    updateTokens: makeFunctionReference<"mutation">("channels:updateTokens"),
  },
  prospects: {
    listByBusiness: makeFunctionReference<"query">("prospects:listByBusiness"),
    get: makeFunctionReference<"query">("prospects:get"),
    create: makeFunctionReference<"mutation">("prospects:create"),
    updateTier: makeFunctionReference<"mutation">("prospects:updateTier"),
    updateStatus: makeFunctionReference<"mutation">("prospects:updateStatus"),
    updateScores: makeFunctionReference<"mutation">("prospects:updateScores"),
    logScoreEvent: makeFunctionReference<"mutation">("prospects:logScoreEvent"),
    getScoreEvents: makeFunctionReference<"query">("prospects:getScoreEvents"),
  },
  ai: {
    chat: makeFunctionReference<"action">("ai:chat"),
    generateCampaign: makeFunctionReference<"action">("ai:generateCampaign"),
    generateCreatives: makeFunctionReference<"action">("ai:generateCreatives"),
    tierProspects: makeFunctionReference<"action">("ai:tierProspects"),
  },
  salesStrategies: {
    getByProspect: makeFunctionReference<"query">("salesStrategies:getByProspect"),
    listByBusiness: makeFunctionReference<"query">("salesStrategies:listByBusiness"),
    upsert: makeFunctionReference<"mutation">("salesStrategies:upsert"),
  },
  customers: {
    listByBusiness: makeFunctionReference<"query">("customers:listByBusiness"),
    create: makeFunctionReference<"mutation">("customers:create"),
  },
}
