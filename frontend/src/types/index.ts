export interface Tournament {
  id: string
  name: string
  date: string
  boards: Board[]
}

export interface Board {
  id: string
  number: number
  dealer: string
  vulnerability: string
  hands: {
    north: string[]
    south: string[]
    east: string[]
    west: string[]
  }
}

export interface Comment {
  id: string
  boardId: string
  author: string
  content: string
  createdAt: string
  replies?: Comment[]
}