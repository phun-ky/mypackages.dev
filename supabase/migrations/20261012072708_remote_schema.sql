


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."package_registry" AS ENUM (
    'npm',
    'github'
);


ALTER TYPE "public"."package_registry" OWNER TO "postgres";


CREATE TYPE "public"."resolve_kind" AS ENUM (
    'package',
    'user',
    'search'
);


ALTER TYPE "public"."resolve_kind" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
declare
  sid uuid;
begin
  -- ✅ Positional args: secret, name, description
  select vault.create_secret(p_secret, p_name, p_description)
    into sid;

  return sid;
end;
$$;


ALTER FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") RETURNS TABLE("token_id" "uuid", "provider" "text", "label" "text", "meta" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    t.id as token_id,
    t.provider,
    t.label,
    t.meta,
    s.updated_at
  from public.user_provider_token_selections s
  join public.user_provider_tokens t on t.id = s.active_token_id
  where s.user_id = auth.uid()
    and s.provider = p_provider;
$$;


ALTER FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'vault'
    AS $$
  select ds.decrypted_secret
  from public.user_provider_token_selections s
  join public.user_provider_tokens t on t.id = s.active_token_id
  join vault.decrypted_secrets ds on ds.id = t.vault_secret_id
  where s.user_id = auth.uid()
    and s.provider = p_provider
  limit 1;
$$;


ALTER FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  k text;
  t text;
begin
  k := payload->>'kind';
  if k not in ('package','user','search') then
    raise exception 'Invalid kind';
  end if;

  if k = 'package' then
    t := lower(trim(payload->>'packageName'));
    insert into public.search_events (user_id, kind, package_name, registry, term, anon_id)
    values (auth.uid(), 'package', t, (payload->>'registry')::package_registry, t, anon_id);

  elsif k = 'user' then
    t := lower(trim(payload->>'username'));
    insert into public.search_events (user_id, kind, username, term, anon_id)
    values (auth.uid(), 'user', t, t, anon_id);

  else
    t := lower(trim(payload->>'q'));
    insert into public.search_events (user_id, kind, q, term, anon_id)
    values (auth.uid(), 'search', t, t, anon_id);
  end if;
end;
$$;


ALTER FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- validate ownership + provider
  if not exists (
    select 1
    from public.user_provider_tokens t
    where t.id = p_token_id
      and t.user_id = auth.uid()
      and t.provider = p_provider
  ) then
    raise exception 'token not found for user/provider';
  end if;

  insert into public.user_provider_token_selections (user_id, provider, active_token_id, updated_at)
  values (auth.uid(), p_provider, p_token_id, now())
  on conflict (user_id, provider)
  do update set active_token_id = excluded.active_token_id, updated_at = now();
end;
$$;


ALTER FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ensured_packages" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_name" "text" NOT NULL,
    "registry" "text" DEFAULT 'npm'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ensured_packages_registry_check" CHECK (("registry" = ANY (ARRAY['npm'::"text", 'github'::"text"])))
);


ALTER TABLE "public"."ensured_packages" OWNER TO "postgres";


ALTER TABLE "public"."ensured_packages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ensured_packages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."search_events" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "kind" "public"."resolve_kind" NOT NULL,
    "package_name" "text",
    "registry" "public"."package_registry",
    "username" "text",
    "q" "text",
    "term" "text" NOT NULL,
    "anon_id" "text",
    CONSTRAINT "search_events_union_check" CHECK (((("kind" = 'package'::"public"."resolve_kind") AND ("package_name" IS NOT NULL) AND ("registry" IS NOT NULL) AND ("username" IS NULL) AND ("q" IS NULL)) OR (("kind" = 'user'::"public"."resolve_kind") AND ("username" IS NOT NULL) AND ("package_name" IS NULL) AND ("registry" IS NULL) AND ("q" IS NULL)) OR (("kind" = 'search'::"public"."resolve_kind") AND ("q" IS NOT NULL) AND ("package_name" IS NULL) AND ("registry" IS NULL) AND ("username" IS NULL))))
);


ALTER TABLE "public"."search_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."latest_lookups" WITH ("security_invoker"='on') AS
 SELECT "created_at",
    "kind",
        CASE
            WHEN ("kind" = 'package'::"public"."resolve_kind") THEN "package_name"
            ELSE NULL::"text"
        END AS "package_name",
        CASE
            WHEN ("kind" = 'package'::"public"."resolve_kind") THEN "registry"
            ELSE NULL::"public"."package_registry"
        END AS "registry",
        CASE
            WHEN ("kind" = 'user'::"public"."resolve_kind") THEN "username"
            ELSE NULL::"text"
        END AS "username"
   FROM "public"."search_events"
  WHERE ("kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"]))
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."latest_lookups" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."latest_unique_lookups" WITH ("security_invoker"='on') AS
 SELECT "created_at",
    "kind",
        CASE
            WHEN ("kind" = 'package'::"public"."resolve_kind") THEN "package_name"
            ELSE NULL::"text"
        END AS "package_name",
        CASE
            WHEN ("kind" = 'package'::"public"."resolve_kind") THEN "registry"
            ELSE NULL::"public"."package_registry"
        END AS "registry",
        CASE
            WHEN ("kind" = 'user'::"public"."resolve_kind") THEN "username"
            ELSE NULL::"text"
        END AS "username",
    "term"
   FROM ( SELECT DISTINCT ON ("search_events"."kind", "search_events"."term") "search_events"."created_at",
            "search_events"."kind",
            "search_events"."package_name",
            "search_events"."registry",
            "search_events"."username",
            "search_events"."term"
           FROM "public"."search_events"
          WHERE ("search_events"."kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"]))
          ORDER BY "search_events"."kind", "search_events"."term", "search_events"."created_at" DESC) "x"
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."latest_unique_lookups" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."popular_lookups_unique_people" WITH ("security_invoker"='on') AS
 SELECT "term",
    "kind",
    "count"(*) AS "unique_people"
   FROM ( SELECT DISTINCT "search_events"."kind",
            "search_events"."term",
            COALESCE(("search_events"."user_id")::"text", "search_events"."anon_id") AS "person"
           FROM "public"."search_events"
          WHERE (("search_events"."kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"])) AND (COALESCE(("search_events"."user_id")::"text", "search_events"."anon_id") IS NOT NULL))) "x"
  GROUP BY "term", "kind"
  ORDER BY ("count"(*)) DESC, "term";


ALTER VIEW "public"."popular_lookups_unique_people" OWNER TO "postgres";


ALTER TABLE "public"."search_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."search_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."trending_lookups_24h" WITH ("security_invoker"='on') AS
 SELECT "term",
    "kind",
    "count"(*) AS "hits"
   FROM "public"."search_events"
  WHERE (("kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"])) AND ("created_at" >= ("now"() - '24:00:00'::interval)))
  GROUP BY "term", "kind"
  ORDER BY ("count"(*)) DESC, "term";


ALTER VIEW "public"."trending_lookups_24h" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_provider_token_selections" (
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "active_token_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_provider_token_selections_provider_check" CHECK (("provider" = ANY (ARRAY['npm'::"text", 'github'::"text"])))
);


ALTER TABLE "public"."user_provider_token_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_provider_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "label" "text",
    "vault_secret_id" "uuid" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_provider_tokens_provider_check" CHECK (("provider" = ANY (ARRAY['npm'::"text", 'github'::"text"])))
);


ALTER TABLE "public"."user_provider_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "npm_username" "text",
    "npm_email" "text",
    "lookup_as_maintainer" boolean DEFAULT false NOT NULL,
    "npm_query_size" integer DEFAULT 50 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "npm_query_size_range" CHECK ((("npm_query_size" >= 1) AND ("npm_query_size" <= 250)))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ensured_packages"
    ADD CONSTRAINT "ensured_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_events"
    ADD CONSTRAINT "search_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_provider_token_selections"
    ADD CONSTRAINT "user_provider_token_selections_pkey" PRIMARY KEY ("user_id", "provider");



ALTER TABLE ONLY "public"."user_provider_tokens"
    ADD CONSTRAINT "user_provider_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_provider_tokens"
    ADD CONSTRAINT "user_provider_tokens_unique" UNIQUE ("user_id", "provider", "label");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE UNIQUE INDEX "ensured_packages_unique" ON "public"."ensured_packages" USING "btree" ("user_id", "registry", "package_name");



CREATE INDEX "ensured_packages_user_idx" ON "public"."ensured_packages" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "search_events_created_at_idx" ON "public"."search_events" USING "btree" ("created_at" DESC);



CREATE INDEX "search_events_term_created_idx" ON "public"."search_events" USING "btree" ("term", "created_at" DESC);



CREATE INDEX "search_events_term_idx" ON "public"."search_events" USING "btree" ("term");



CREATE INDEX "user_provider_token_selections_active_idx" ON "public"."user_provider_token_selections" USING "btree" ("active_token_id");



CREATE INDEX "user_provider_tokens_user_provider_idx" ON "public"."user_provider_tokens" USING "btree" ("user_id", "provider");



CREATE OR REPLACE TRIGGER "trg_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."ensured_packages"
    ADD CONSTRAINT "ensured_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_events"
    ADD CONSTRAINT "search_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_provider_token_selections"
    ADD CONSTRAINT "user_provider_token_selections_active_token_id_fkey" FOREIGN KEY ("active_token_id") REFERENCES "public"."user_provider_tokens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_provider_token_selections"
    ADD CONSTRAINT "user_provider_token_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_provider_tokens"
    ADD CONSTRAINT "user_provider_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "allow insert" ON "public"."search_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "delete own ensured packages" ON "public"."ensured_packages" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ensured_packages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert own ensured packages" ON "public"."ensured_packages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "no public select" ON "public"."search_events" FOR SELECT USING (false);



CREATE POLICY "public read for popular lookups unique people" ON "public"."search_events" FOR SELECT USING ((("kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"])) AND (COALESCE(("user_id")::"text", "anon_id") IS NOT NULL)));



CREATE POLICY "public read of latest search_events" ON "public"."search_events" FOR SELECT USING (("kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"])));



CREATE POLICY "public read of search_events for latest lookups" ON "public"."search_events" FOR SELECT USING (("kind" = ANY (ARRAY['package'::"public"."resolve_kind", 'user'::"public"."resolve_kind"])));



CREATE POLICY "read own ensured packages" ON "public"."ensured_packages" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."search_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_provider_token_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_provider_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_delete_own" ON "public"."user_settings" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_settings_insert_own" ON "public"."user_settings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_settings_select_own" ON "public"."user_settings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_settings_update_own" ON "public"."user_settings" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_vault_secret"("p_name" "text", "p_secret" "text", "p_description" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_provider_token_meta"("p_provider" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_provider_token_secret"("p_provider" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_search_event"("payload" "jsonb", "anon_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_active_provider_token"("p_provider" "text", "p_token_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."ensured_packages" TO "anon";
GRANT ALL ON TABLE "public"."ensured_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."ensured_packages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ensured_packages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ensured_packages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ensured_packages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."search_events" TO "anon";
GRANT ALL ON TABLE "public"."search_events" TO "authenticated";
GRANT ALL ON TABLE "public"."search_events" TO "service_role";



GRANT ALL ON TABLE "public"."latest_lookups" TO "anon";
GRANT ALL ON TABLE "public"."latest_lookups" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_lookups" TO "service_role";



GRANT ALL ON TABLE "public"."latest_unique_lookups" TO "anon";
GRANT ALL ON TABLE "public"."latest_unique_lookups" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_unique_lookups" TO "service_role";



GRANT ALL ON TABLE "public"."popular_lookups_unique_people" TO "anon";
GRANT ALL ON TABLE "public"."popular_lookups_unique_people" TO "authenticated";
GRANT ALL ON TABLE "public"."popular_lookups_unique_people" TO "service_role";



GRANT ALL ON SEQUENCE "public"."search_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."search_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."search_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."trending_lookups_24h" TO "anon";
GRANT ALL ON TABLE "public"."trending_lookups_24h" TO "authenticated";
GRANT ALL ON TABLE "public"."trending_lookups_24h" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_provider_token_selections" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_provider_token_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_provider_token_selections" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_provider_tokens" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_provider_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_provider_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke delete on table "public"."user_provider_token_selections" from "anon";

revoke insert on table "public"."user_provider_token_selections" from "anon";

revoke select on table "public"."user_provider_token_selections" from "anon";

revoke update on table "public"."user_provider_token_selections" from "anon";

revoke delete on table "public"."user_provider_token_selections" from "authenticated";

revoke insert on table "public"."user_provider_token_selections" from "authenticated";

revoke select on table "public"."user_provider_token_selections" from "authenticated";

revoke update on table "public"."user_provider_token_selections" from "authenticated";

revoke delete on table "public"."user_provider_tokens" from "anon";

revoke insert on table "public"."user_provider_tokens" from "anon";

revoke select on table "public"."user_provider_tokens" from "anon";

revoke update on table "public"."user_provider_tokens" from "anon";

revoke delete on table "public"."user_provider_tokens" from "authenticated";

revoke insert on table "public"."user_provider_tokens" from "authenticated";

revoke select on table "public"."user_provider_tokens" from "authenticated";

revoke update on table "public"."user_provider_tokens" from "authenticated";


