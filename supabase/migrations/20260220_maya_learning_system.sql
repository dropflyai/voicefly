-- Maya Learning System: conversation logging, insights, and RAG

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation logs from the public chatbot
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]',
  lead_captured BOOLEAN DEFAULT FALSE,
  exchange_count INTEGER DEFAULT 0,
  visitor_business_type TEXT,
  visitor_employee_interest TEXT,
  outcome TEXT DEFAULT 'browsing',
  insights_extracted BOOLEAN DEFAULT FALSE,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_chat_conversations" ON chat_conversations
  FOR ALL USING (auth.role() = 'service_role');

-- Maya's learned insights from real conversations
CREATE TABLE IF NOT EXISTS maya_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  trigger_keywords TEXT[],
  situation TEXT NOT NULL,
  winning_response TEXT NOT NULL,
  times_seen INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  conversion_rate NUMERIC(4,2) DEFAULT 0,
  effectiveness_score INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'manual',
  source_conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maya_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_maya_insights" ON maya_insights
  FOR ALL USING (auth.role() = 'service_role');

-- pgvector RPC for RAG retrieval of successful conversations
CREATE OR REPLACE FUNCTION match_successful_conversations(
  query_embedding VECTOR(1536), match_count INT DEFAULT 3
) RETURNS TABLE(id UUID, messages JSONB, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.messages, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM chat_conversations c
  WHERE c.lead_captured = TRUE AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding LIMIT match_count;
END;$$;
