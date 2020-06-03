PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

ALTER TABLE usage_disconnect RENAME TO _usage_disconnect_old;

CREATE TABLE usage_disconnect (
    uuid TEXT,
    tn_proxy_client_id TEXT NOT NULL,
    sid TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    to_port INTEGER NOT NULL,
    time_stamp TEXT NOT NULL,
    elapsed_ms INTEGER
);

INSERT INTO usage_disconnect (
    uuid,
    tn_proxy_client_id,
    sid,
    from_addr,
    to_addr,
    to_port,
    time_stamp,
    elapsed_ms)
  SELECT 
    uuid,
    tn_proxy_client_id,
    sid,
    from_addr,
    to_addr,
    to_port,
    time_stamp,
    elapsed_ms
  FROM _usage_disconnect_old;

DROP TABLE _usage_disconnect_old;

COMMIT;

PRAGMA foreign_keys=on;