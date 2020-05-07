CREATE TABLE IF NOT EXISTS usage_connect (
    uuid TEXT NOT NULL,
    tn_proxy_client_id TEXT NOT NULL,
    sid TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    to_port INTEGER NOT NULL,
    time_stamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_disconnect (
    uuid TEXT,
    tn_proxy_client_id TEXT NOT NULL,
    sid TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    to_port INTEGER NOT NULL,
    time_stamp TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL
);

CREATE TABLE usage_mxp_send (
    sid TEXT,
    from_addr TEXT,
    to_addr TEXT,
    to_port INTEGER,
    time_stamp TEXT NOT NULL
);