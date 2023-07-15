select column_name, column_default, data_type, character_maximum_length
 from INFORMATION_SCHEMA.COLUMNS where table_name ='TABLENAME';

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  postid INTEGER NOT NULL,
  userid INTEGER,
  comment VARCHAR(400),
  time_posted TIMESTAMP DEFAULT NOW()
)

CREATE TABLE postlikes (
  id SERIAL PRIMARY KEY,
  postid INTEGER,
  userid INTEGER
)

CREATE TABLE postreply (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL,
  commentid INTEGER NOT NULL,
  replyid INTEGER,
  reply TEXT,
  postid INTEGER NOT NULL,
  time_posted TIMESTAMP DEFAULT NOW()
)

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  userid INTEGER,
  title VARCHAR(60),
  description VARCHAR(800),
  audio TEXT,
  time_posted TIMESTAMP DEFAULT NOW()
)

CREATE TABLE posttags (
  postid INTEGER NOT NULL,
  electronic BOOLEAN DEFAULT FALSE,
  hiphop BOOLEAN DEFAULT FALSE,
  pop BOOLEAN DEFAULT FALSE,
  rock BOOLEAN DEFAULT FALSE,
  punk BOOLEAN DEFAULT FALSE,
  metal BOOLEAN DEFAULT FALSE,
  jazz BOOLEAN DEFAULT FALSE,
  classical BOOLEAN DEFAULT FALSE
)

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE userprofile (
  userid INTEGER UNIQUE NOT NULL,
  contact VARCHAR(255) DEFAULT '',
  bio VARCHAR(800) DEFAULT '
  ○ Hi my name is ...                                     
  ○ The instruments I play are ...                         
  ○ My favorite genres are ...                             
  ○ Thanks for checking out my profile!'
)

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE
)

CREATE TABLE verify (
  userid INTEGER NOT NULL,
  token TEXT,
  time_sent TIMESTAMP DEFAULT NOW()
)