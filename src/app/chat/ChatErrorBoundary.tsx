"use client"

import { Component, ReactNode } from "react"

export default class ChatErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: "" }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Backend not connected
            </h2>
            <p className="text-sm text-gray-500">
              Spun needs a Convex backend to run. Set it up with:
            </p>
            <pre className="bg-gray-900 rounded-md p-3 text-left text-xs text-green-400 overflow-x-auto">
              <code>npx convex dev</code>
            </pre>
            <p className="text-xs text-gray-400">
              This will create your backend and add the URL to{" "}
              <code className="text-gray-500">.env.local</code>. Then restart
              the dev server.
            </p>
            <details className="text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
                {this.state.error}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
