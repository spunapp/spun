/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adCreatives from "../adCreatives.js";
import type * as ai from "../ai.js";
import type * as approvals from "../approvals.js";
import type * as brandAssets from "../brandAssets.js";
import type * as businesses from "../businesses.js";
import type * as campaigns from "../campaigns.js";
import type * as channels from "../channels.js";
import type * as conversations from "../conversations.js";
import type * as customers from "../customers.js";
import type * as messages from "../messages.js";
import type * as organisations from "../organisations.js";
import type * as prospects from "../prospects.js";
import type * as salesStrategies from "../salesStrategies.js";
import type * as usage from "../usage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adCreatives: typeof adCreatives;
  ai: typeof ai;
  approvals: typeof approvals;
  brandAssets: typeof brandAssets;
  businesses: typeof businesses;
  campaigns: typeof campaigns;
  channels: typeof channels;
  conversations: typeof conversations;
  customers: typeof customers;
  messages: typeof messages;
  organisations: typeof organisations;
  prospects: typeof prospects;
  salesStrategies: typeof salesStrategies;
  usage: typeof usage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
