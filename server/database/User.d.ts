export interface User {
  id: number,
  username: string,
  email: string,
  password: string
}

export interface OptionalUser {
  id?: number,
  username?: string,
  email?: string,
  password?: string
}