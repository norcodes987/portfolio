'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={`flex flex-col gap-2 ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={`inline-flex h-10 items-center rounded-lg bg-gray-100 p-1 ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={`inline-flex min-h-8 flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={`mt-3 ${className ?? ''}`} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
