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
            <div className="w-12 h-12 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Backend not connected
            </h2>
            <p className="text-sm text-slate-400">
              Spun needs a Convex backend to run. Set it up with:
            </p>
            <pre className="bg-slate-800 rounded-lg p-3 text-left text-xs text-green-400 overflow-x-auto">
              <code>npx convex dev</code>
            </pre>
            <p className="text-xs text-slate-500">
              This will create your backend and add the URL to{" "}
              <code className="text-slate-400">.env.local</code>. Then restart
              the dev server.
            </p>
            <details className="text-left">
              <summary className="text-xs text-slate-600 cursor-pointer">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
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
