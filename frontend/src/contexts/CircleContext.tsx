import { createContext, useContext, useState, ReactNode } from 'react'

interface Circle {
  id: string
  name: string
}

interface Tournament {
  id: string
  name: string
}

interface NavigationContextType {
  currentCircle: Circle | null
  setCurrentCircle: (circle: Circle | null) => void
  currentTournament: Tournament | null
  setCurrentTournament: (tournament: Tournament | null) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function CircleProvider({ children }: { children: ReactNode }) {
  const [currentCircle, setCurrentCircle] = useState<Circle | null>(null)
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null)

  return (
    <NavigationContext.Provider value={{ 
      currentCircle, 
      setCurrentCircle,
      currentTournament,
      setCurrentTournament
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useCircle() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useCircle must be used within a CircleProvider')
  }
  return context
}