-- Up Migration

CREATE TYPE user_role AS ENUM ('admin', 'player');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  email         text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  role          user_role NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE users;

DROP TYPE user_role;
