-- Up Migration

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  court_id     integer NOT NULL REFERENCES courts (id) ON DELETE RESTRICT,
  time_slot    tstzrange NOT NULL,
  price_cents  integer NOT NULL CHECK (price_cents >= 0),
  cancelled_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_slot_shape
    CHECK (lower_inc(time_slot) AND NOT upper_inc(time_slot) AND NOT upper_inf(time_slot)),
  CONSTRAINT bookings_no_court_overlap
    EXCLUDE USING gist (court_id WITH =, time_slot WITH &&) WHERE (cancelled_at IS NULL)
);

CREATE INDEX bookings_user_id_idx ON bookings (user_id);

-- Down Migration

DROP TABLE bookings;

DROP EXTENSION btree_gist;
