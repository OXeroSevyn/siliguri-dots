-- ============================================================
-- Siliguri News: SQL Schema for New Features
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add 'views' column to articles table (if not exists)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- 2. Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.email() = user_email);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 3. Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_email, article_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    USING (auth.email() = user_email)
    WITH CHECK (auth.email() = user_email);

-- 4. Newsletter Subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    active BOOLEAN DEFAULT true
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can see their own subscription" ON newsletter_subscribers
    FOR SELECT USING (auth.email() = email);

-- 5. Article Reactions table
CREATE TABLE IF NOT EXISTS article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'love')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(article_id, user_email, type)
);

ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON article_reactions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add/remove their reactions" ON article_reactions
    USING (auth.email() = user_email)
    WITH CHECK (auth.email() = user_email);

-- 6. Article Comments table
CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON article_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" ON article_comments
    FOR INSERT WITH CHECK (auth.email() = user_email);

-- 7. Function to increment article views atomically
CREATE OR REPLACE FUNCTION increment_article_views(article_id_param BIGINT)
RETURNS INTEGER AS $$
DECLARE
    new_views INTEGER;
BEGIN
    UPDATE articles
    SET views = views + 1
    WHERE id = article_id_param
    RETURNING views INTO new_views;
    RETURN new_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
