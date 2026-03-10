/* eslint-disable */
/**
 * Generated API stub — will be replaced by `npx convex dev`
 *
 * This file provides type-safe references to Convex functions.
 * Run `npx convex dev` to regenerate with actual types.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stub(name: string): any {
  // Return a function reference that Convex hooks can accept
  // The actual implementation lives on the Convex server
  const fn = (() => {}) as any
  fn._name = name
  fn.isRegistered = true
  return fn
}

export const api = {
  conversations: {
    list: stub("conversations:list"),
    get: stub("conversations:get"),
    getMessages: stub("conversations:getMessages"),
    create: stub("conversations:create"),
    updateTitle: stub("conversations:updateTitle"),
  },
  messages: {
    send: stub("messages:send"),
    updateMetadata: stub("messages:updateMetadata"),
    getByConversation: stub("messages:getByConversation"),
  },
  businesses: {
    get: stub("businesses:get"),
    getByUser: stub("businesses:getByUser"),
    create: stub("businesses:create"),
    update: stub("businesses:update"),
    updateTrustMode: stub("businesses:updateTrustMode"),
  },
  campaigns: {
    listByBusiness: stub("campaigns:listByBusiness"),
    get: stub("campaigns:get"),
    create: stub("campaigns:create"),
    updateStatus: stub("campaigns:updateStatus"),
  },
  approvals: {
    listPending: stub("approvals:listPending"),
    create: stub("approvals:create"),
    approve: stub("approvals:approve"),
    reject: stub("approvals:reject"),
  },
  usage: {
    getCurrentUsage: stub("usage:getCurrentUsage"),
    getOrCreateLedger: stub("usage:getOrCreateLedger"),
    incrementCampaigns: stub("usage:incrementCampaigns"),
    incrementCreatives: stub("usage:incrementCreatives"),
    incrementChannels: stub("usage:incrementChannels"),
  },
  channels: {
    listByBusiness: stub("channels:listByBusiness"),
    connect: stub("channels:connect"),
    disconnect: stub("channels:disconnect"),
    updateStatus: stub("channels:updateStatus"),
    updateTokens: stub("channels:updateTokens"),
  },
  prospects: {
    listByBusiness: stub("prospects:listByBusiness"),
    get: stub("prospects:get"),
    create: stub("prospects:create"),
    updateTier: stub("prospects:updateTier"),
    updateStatus: stub("prospects:updateStatus"),
    updateScores: stub("prospects:updateScores"),
    logScoreEvent: stub("prospects:logScoreEvent"),
    getScoreEvents: stub("prospects:getScoreEvents"),
  },
  ai: {
    chat: stub("ai:chat"),
    generateCampaign: stub("ai:generateCampaign"),
    generateCreatives: stub("ai:generateCreatives"),
  },
}
