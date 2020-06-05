-- https://stackoverflow.com/questions/33104101/ensure-sqlite-table-only-has-one-row
CREATE TABLE client_config (
    id INTEGER PRIMARY KEY CHECK (id = 0),
    socket_io_host TEXT,
    socket_io_port INTEGER
);

INSERT INTO client_config (id) VALUES(0);
