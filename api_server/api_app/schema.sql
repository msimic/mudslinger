DROP TABLE IF EXISTS usage_connect;
DROP TABLE IF EXISTS usage_disconnect;

CREATE TABLE usage_connect (
    uuid TEXT NOT NULL,
    tn_proxy_client_id TEXT NOT NULL,
    sid TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    to_port INTEGER NOT NULL,
    time_stamp TEXT NOT NULL
);

CREATE TABLE usage_disconnect (
    uuid TEXT,
    tn_proxy_client_id TEXT NOT NULL,
    sid TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    to_port INTEGER NOT NULL,
    time_stamp TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL
);
