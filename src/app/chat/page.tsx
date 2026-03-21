import { auth } from "@clerk/nextjs/server"
import { preloadQuery } from "convex/nextjs"
import { api } from "../../../convex/_generated/api"
import ChatClient from "./ChatClient"
import ChatErrorBoundary from "./ChatErrorBoundary"

export default async function ChatPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const [preloadedData, preloadedBusiness] = await Promise.all([
    preloadQuery(api.conversations.listWithLatestMessages, { userId }),
    preloadQuery(api.businesses.getByUser, { userId }),
  ])

  return (
    <ChatErrorBoundary>
      <ChatClient
        userId={userId}
        preloadedData={preloadedData}
        preloadedBusiness={preloadedBusiness}
      />
    </ChatErrorBoundary>
  )
}
