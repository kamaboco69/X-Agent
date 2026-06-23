-- X PIX — Supabase (PostgreSQL) Schema
-- Run this in the Supabase SQL editor to set up your database

-- X Accounts
CREATE TABLE IF NOT EXISTS x_accounts (
  id TEXT PRIMARY KEY,
  x_user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  consumer_key TEXT,
  consumer_secret TEXT,
  access_token_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Engagement Gates
CREATE TABLE IF NOT EXISTS engagement_gates (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('like', 'repost', 'reply', 'follow', 'quote')),
  action_type TEXT NOT NULL CHECK (action_type IN ('mention_post', 'dm', 'verify_only')),
  template TEXT NOT NULL,
  link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  line_harness_url TEXT,
  line_harness_api_key TEXT,
  line_harness_tag TEXT,
  line_harness_scenario_id TEXT,
  lottery_enabled BOOLEAN DEFAULT FALSE,
  lottery_rate INTEGER DEFAULT 100,
  lottery_win_template TEXT,
  lottery_lose_template TEXT,
  polling_strategy TEXT DEFAULT 'hot_window' CHECK (polling_strategy IN ('hot_window', 'constant', 'manual')),
  expires_at TIMESTAMPTZ,
  next_poll_at TIMESTAMPTZ,
  api_calls_total INTEGER DEFAULT 0,
  require_like BOOLEAN DEFAULT FALSE,
  require_repost BOOLEAN DEFAULT FALSE,
  require_follow BOOLEAN DEFAULT FALSE,
  last_reply_since_id TEXT,
  reply_keyword TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_engagement_gates_active ON engagement_gates(is_active);
CREATE INDEX IF NOT EXISTS idx_engagement_gates_next_poll ON engagement_gates(next_poll_at, is_active);

-- Engagement Gate Deliveries
CREATE TABLE IF NOT EXISTS engagement_gate_deliveries (
  id TEXT PRIMARY KEY,
  gate_id TEXT NOT NULL REFERENCES engagement_gates(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  x_username TEXT,
  delivered_post_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('delivered', 'failed', 'pending')),
  token TEXT UNIQUE,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gate_id, x_user_id)
);
CREATE INDEX IF NOT EXISTS idx_deliveries_gate_id ON engagement_gate_deliveries(gate_id);

-- Followers
CREATE TABLE IF NOT EXISTS followers (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  is_following BOOLEAN DEFAULT TRUE,
  is_followed BOOLEAN DEFAULT FALSE,
  user_id TEXT,
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unfollowed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(x_account_id, x_user_id)
);
CREATE INDEX IF NOT EXISTS idx_followers_x_user_id ON followers(x_user_id);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(x_account_id, name)
);

-- Follower <-> Tag
CREATE TABLE IF NOT EXISTS follower_tags (
  follower_id TEXT NOT NULL REFERENCES followers(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_follower_tags_tag_id ON follower_tags(tag_id);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  media_ids JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed')),
  posted_tweet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- Follower Snapshots (daily tracking)
CREATE TABLE IF NOT EXISTS follower_snapshots (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER NOT NULL,
  following_count INTEGER NOT NULL,
  tweet_count INTEGER NOT NULL DEFAULT 0,
  recorded_at DATE NOT NULL,
  UNIQUE(x_account_id, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_follower_snapshots_account_date ON follower_snapshots(x_account_id, recorded_at);

-- Quote Tweets
CREATE TABLE IF NOT EXISTS quote_tweets (
  id TEXT PRIMARY KEY,
  source_tweet_id TEXT NOT NULL,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_username TEXT,
  author_display_name TEXT,
  author_profile_image_url TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quote_tweets_source ON quote_tweets(source_tweet_id);
CREATE INDEX IF NOT EXISTS idx_quote_tweets_account ON quote_tweets(x_account_id, discovered_at DESC);

-- Engagement Actions
CREATE TABLE IF NOT EXISTS engagement_actions (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'repost', 'reply')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(x_account_id, tweet_id, action_type)
);
CREATE INDEX IF NOT EXISTS idx_engagement_actions_account ON engagement_actions(x_account_id);

-- API Usage Logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id TEXT PRIMARY KEY,
  x_account_id TEXT NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(x_account_id, endpoint, date)
);
CREATE INDEX IF NOT EXISTS idx_usage_account_date ON api_usage_logs(x_account_id, date);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LINE Harness Connections
CREATE TABLE IF NOT EXISTS line_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  worker_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (enable for all tables, access controlled via service role key in API routes)
ALTER TABLE x_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_gate_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_connections ENABLE ROW LEVEL SECURITY;
