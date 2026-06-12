--
-- PostgreSQL database dump
--

\restrict YjMT5Ibjer4saMpMawIrArI9fQDbVobksVjYYqI3nKKv9BnhIG02UNMFcAVUcoi

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

--
-- Name: admin_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_role AS ENUM (
    'owner',
    'manager',
    'staff'
);


--
-- Name: cover_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cover_type AS ENUM (
    'normal',
    'coated'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'draft',
    'submitted',
    'confirmed',
    'in_production',
    'ready',
    'delivered',
    'cancelled'
);


--
-- Name: phone_brand; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.phone_brand AS ENUM (
    'apple',
    'samsung',
    'xiaomi',
    'huawei',
    'motorola',
    'other',
    'lg',
    'nokia',
    'zte',
    'pixel',
    'oneplus',
    'alcatel',
    'blu'
);


--
-- Name: telegram_subscriber_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.telegram_subscriber_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_sessions (
    id text NOT NULL,
    admin_id text NOT NULL,
    token_hash text NOT NULL,
    user_agent text,
    ip text,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role public.admin_role DEFAULT 'staff'::public.admin_role NOT NULL,
    last_login_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cover_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cover_pricing (
    type public.cover_type NOT NULL,
    price_usd_cents integer NOT NULL,
    price_cup integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    phone text NOT NULL,
    name text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_events (
    id text NOT NULL,
    order_id text NOT NULL,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    note text,
    actor text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_photos (
    id text NOT NULL,
    order_id text NOT NULL,
    slot_index integer NOT NULL,
    original_url text NOT NULL,
    thumbnail_url text,
    transform jsonb NOT NULL,
    width_px integer,
    height_px integer,
    size_bytes integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cropped_url text
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    code text NOT NULL,
    user_id text,
    customer_phone text,
    customer_name text,
    phone_model_slug text NOT NULL,
    phone_model_name text NOT NULL,
    layout_id text NOT NULL,
    layout_name text NOT NULL,
    status public.order_status DEFAULT 'submitted'::public.order_status NOT NULL,
    preview_url text,
    print_ready_url text,
    customer_notes text,
    admin_notes text,
    price_cup integer NOT NULL,
    submitted_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    width_mm integer,
    height_mm integer,
    corner_radius_mm integer,
    camera_box jsonb,
    cover_type public.cover_type DEFAULT 'normal'::public.cover_type NOT NULL,
    price_usd_cents integer DEFAULT 700 NOT NULL,
    custom_wrap_mm integer
);


--
-- Name: phone_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phone_models (
    id text NOT NULL,
    slug text NOT NULL,
    brand public.phone_brand NOT NULL,
    name text NOT NULL,
    aliases jsonb DEFAULT '[]'::jsonb NOT NULL,
    width_mm integer NOT NULL,
    height_mm integer NOT NULL,
    corner_radius_mm integer DEFAULT 8 NOT NULL,
    camera_x integer,
    camera_y integer,
    camera_w integer,
    camera_h integer,
    popularity integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    depth_mm integer DEFAULT 0 NOT NULL
);


--
-- Name: telegram_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_subscribers (
    chat_id text NOT NULL,
    username text,
    first_name text,
    last_name text,
    status public.telegram_subscriber_status DEFAULT 'pending'::public.telegram_subscriber_status NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    token_hash text NOT NULL,
    user_agent text,
    ip text,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    phone text NOT NULL,
    password_hash text NOT NULL,
    name text,
    last_login_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: cover_pricing cover_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cover_pricing
    ADD CONSTRAINT cover_pricing_pkey PRIMARY KEY (type);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: order_events order_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_pkey PRIMARY KEY (id);


--
-- Name: order_photos order_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_photos
    ADD CONSTRAINT order_photos_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: phone_models phone_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phone_models
    ADD CONSTRAINT phone_models_pkey PRIMARY KEY (id);


--
-- Name: telegram_subscribers telegram_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_subscribers
    ADD CONSTRAINT telegram_subscribers_pkey PRIMARY KEY (chat_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions_admin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_sessions_admin_idx ON public.admin_sessions USING btree (admin_id);


--
-- Name: admin_sessions_token_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_sessions_token_uq ON public.admin_sessions USING btree (token_hash);


--
-- Name: admin_users_email_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_email_uq ON public.admin_users USING btree (email);


--
-- Name: customers_phone_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_phone_uq ON public.customers USING btree (phone);


--
-- Name: order_events_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_events_order_idx ON public.order_events USING btree (order_id);


--
-- Name: order_photos_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_photos_order_idx ON public.order_photos USING btree (order_id);


--
-- Name: orders_code_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX orders_code_uq ON public.orders USING btree (code);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id);


--
-- Name: phone_models_brand_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX phone_models_brand_idx ON public.phone_models USING btree (brand);


--
-- Name: phone_models_popularity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX phone_models_popularity_idx ON public.phone_models USING btree (popularity);


--
-- Name: phone_models_slug_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX phone_models_slug_uq ON public.phone_models USING btree (slug);


--
-- Name: telegram_subscribers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telegram_subscribers_status_idx ON public.telegram_subscribers USING btree (status);


--
-- Name: user_sessions_token_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_sessions_token_uq ON public.user_sessions USING btree (token_hash);


--
-- Name: user_sessions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_sessions_user_idx ON public.user_sessions USING btree (user_id);


--
-- Name: users_phone_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_uq ON public.users USING btree (phone);


--
-- Name: admin_sessions admin_sessions_admin_id_admin_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_admin_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: order_events order_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_events
    ADD CONSTRAINT order_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_photos order_photos_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_photos
    ADD CONSTRAINT order_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_sessions user_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YjMT5Ibjer4saMpMawIrArI9fQDbVobksVjYYqI3nKKv9BnhIG02UNMFcAVUcoi

