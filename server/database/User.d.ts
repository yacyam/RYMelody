export interface Verify {
  userid: number,
  token: string,
  time_sent: Date
}

export interface User {
  id: number,
  username: string,
  email: string,
  password: string,
  verified: boolean
}

export interface OptionalUser {
  id?: number,
  username?: string,
  email?: string,
  password?: string
}