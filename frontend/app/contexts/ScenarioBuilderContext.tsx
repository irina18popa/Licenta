// app/contexts/ScenarioBuilderContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react'
import { getDeviceById } from '../apis'


export type ScenarioCommand = {
  deviceId: string
  protocol: 'upnp' | 'tuya' | string
  address: string
  commands: Array<{ name: string; parameters: any } | { code: string; value: any }>
}

interface BuilderContext {
  commands: ScenarioCommand[]
  add: (
    deviceId: string,
    protocol: ScenarioCommand['protocol'],
    raw: { name?: string; parameters?: any; code?: string; value?: any }
  ) => Promise<void>
  reset: () => void
}

const ctx = createContext<BuilderContext | null>(null)

export function ScenarioBuilderProvider({ children }: { children: ReactNode }) {
  const [commands, setCommands] = useState<ScenarioCommand[]>([])

  const add = async (
    deviceId: string,
    protocol: ScenarioCommand['protocol'],
    raw: { name?: string; parameters?: any; code?: string; value?: any }
  ) => {
    const dev = await getDeviceById(deviceId)
    const address = dev.metadata || 'unknown'

    let entry
    if (protocol === 'upnp') {
      entry = { name: raw.name!, parameters: raw.parameters! }
    } else {
      entry = { code: raw.code!, value: raw.value! }
    }

    setCommands(cmds => [
      ...cmds,
      { deviceId, protocol, address, commands: [entry] },
    ])
  }

  const reset = () => setCommands([])

  return (
    <ctx.Provider value={{ commands, add, reset }}>
      {children}
    </ctx.Provider>
  )
}

export function useScenarioBuilder() {
  const c = useContext(ctx)
  if (!c) throw new Error('useScenarioBuilder must be under ScenarioBuilderProvider')
  return c
}
