import React from 'react'

interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-gray-400">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>
    </div>
  )
}
