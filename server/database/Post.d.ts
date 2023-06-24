export interface Post {
  id: number,
  username: string,
  title: string,
  description: string,
  audio: string
}

export interface HomePost {
  id: number,
  username: string,
  title: string,
  description: string
}

export interface Comment {
  id: number,
  username: string,
  comment: string
}