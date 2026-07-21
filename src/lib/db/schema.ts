import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "replied",
  "won",
  "lost",
]);

export const leadTemperatureEnum = pgEnum("lead_temperature", [
  "cold",
  "warm",
  "hot",
]);

export const leadSourceEnum = pgEnum("lead_source", ["reddit", "x"]);

export const signalTypeEnum = pgEnum("signal_type", [
  "re_hiring",
  "complaint",
  "churn_indicator",
]);

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  siteUrl: text("site_url").notNull(),
  extractedServices: jsonb("extracted_services").$type<string[]>().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  toneSample: text("tone_sample"),
  priceTierSignal: text("price_tier_signal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const competitorAgencies = pgTable("competitor_agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  siteUrl: text("site_url").notNull(),
  extractedClients: jsonb("extracted_clients").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlists = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  xQueries: jsonb("x_queries").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id, { onDelete: "cascade" }),
  source: leadSourceEnum("source").notNull().default("reddit"),
  sourcePostUrl: text("source_post_url").notNull(),
  authorUsername: text("author_username"),
  title: text("title").notNull(),
  snippet: text("snippet"),
  subreddit: text("subreddit"),
  postedAt: timestamp("posted_at"),
  surfacedAt: timestamp("surfaced_at").defaultNow().notNull(),
  intentScore: real("intent_score"),
  serviceMatchScore: real("service_match_score"),
  temperature: leadTemperatureEnum("temperature"),
  suggestedReply: text("suggested_reply"),
  status: leadStatusEnum("status").notNull().default("new"),
});

export const competitorClientSignals = pgTable("competitor_client_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorAgencyId: uuid("competitor_agency_id")
    .notNull()
    .references(() => competitorAgencies.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  matchedSourcePostUrl: text("matched_source_post_url"),
  signalType: signalTypeEnum("signal_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
