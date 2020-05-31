CREATE TABLE admin_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE telnet_proxies_web_admin (
    url TEXT PRIMARY KEY
);