-- Up Migration

CREATE TYPE sport_type AS ENUM ('tennis', 'padel', 'squash', 'badminton', 'pickleball');

CREATE TABLE courts (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name               text NOT NULL,
  sport_type         sport_type NOT NULL,
  hourly_price_cents integer NOT NULL CHECK (hourly_price_cents >= 0),
  opens_at           time NOT NULL DEFAULT '08:00',
  closes_at          time NOT NULL DEFAULT '23:00',
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at > opens_at)
);

CREATE UNIQUE INDEX courts_name_unique ON courts (lower(name));

-- Down Migration

DROP TABLE courts;

DROP TYPE sport_type;
