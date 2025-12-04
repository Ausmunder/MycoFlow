--
-- PostgreSQL database dump
--

\restrict SuFVkXWL1PhiVZucU02iTJ8R8Mc645CvwQUjwWvuliWeVo29MXdoGc803Ng5bqQ

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: bagstatus; Type: TYPE; Schema: public; Owner: sopp
--

CREATE TYPE public.bagstatus AS ENUM (
    'INOKULERT',
    'INKUBERING',
    'KLAR',
    'I_FRUKTING',
    'HOSTET',
    'FORKASTET'
);


ALTER TYPE public.bagstatus OWNER TO sopp;

--
-- Name: kontamtype; Type: TYPE; Schema: public; Owner: sopp
--

CREATE TYPE public.kontamtype AS ENUM (
    'INGEN',
    'GRONN_MUGG',
    'BAKTERIE',
    'COBWEB',
    'ANNET'
);


ALTER TYPE public.kontamtype OWNER TO sopp;

--
-- Name: straintype; Type: TYPE; Schema: public; Owner: sopp
--

CREATE TYPE public.straintype AS ENUM (
    'OYSTER',
    'LIONSMANE',
    'SHIITAKE'
);


ALTER TYPE public.straintype OWNER TO sopp;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: batch_info; Type: TABLE; Schema: public; Owner: sopp
--

CREATE TABLE public.batch_info (
    id integer NOT NULL,
    batch_code character varying NOT NULL,
    strain_name character varying NOT NULL,
    lc_source character varying,
    generation integer,
    notes character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.batch_info OWNER TO sopp;

--
-- Name: batch_info_id_seq; Type: SEQUENCE; Schema: public; Owner: sopp
--

CREATE SEQUENCE public.batch_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.batch_info_id_seq OWNER TO sopp;

--
-- Name: batch_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sopp
--

ALTER SEQUENCE public.batch_info_id_seq OWNED BY public.batch_info.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: sopp
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    strain public.straintype NOT NULL,
    lc_kode character varying,
    lc_vol character varying,
    spawn_type character varying,
    spawn_batch character varying,
    spawn_dato_inok timestamp without time zone,
    spawn_kg double precision,
    spawn_dager_ink integer,
    bag_forventet_kolon timestamp without time zone,
    bag_substrat_type character varying,
    bag_kg_substrat double precision,
    bag_dato_inok timestamp without time zone,
    bag_dager_ink integer,
    bag_status public.bagstatus,
    bag_kontam public.kontamtype,
    bag_frukting_start timestamp without time zone,
    bag_temp_kammer double precision,
    bag_lf_kammer double precision,
    bag_host1_start timestamp without time zone,
    bag_host1_slutt timestamp without time zone,
    bag_host1_total_kg double precision,
    bag_host2_start timestamp without time zone,
    bag_host2_slutt timestamp without time zone,
    bag_syklus_lengde integer,
    bag_host2_total_kg double precision,
    notater character varying,
    archived boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    batch_info_id integer
);


ALTER TABLE public.batches OWNER TO sopp;

--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: sopp
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.batches_id_seq OWNER TO sopp;

--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sopp
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: sensor_readings; Type: TABLE; Schema: public; Owner: sopp
--

CREATE TABLE public.sensor_readings (
    id integer NOT NULL,
    sensor_type character varying NOT NULL,
    location character varying NOT NULL,
    value double precision NOT NULL,
    unit character varying,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sensor_readings OWNER TO sopp;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE; Schema: public; Owner: sopp
--

CREATE SEQUENCE public.sensor_readings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sensor_readings_id_seq OWNER TO sopp;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sopp
--

ALTER SEQUENCE public.sensor_readings_id_seq OWNED BY public.sensor_readings.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: sopp
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    name character varying NOT NULL,
    strain public.straintype NOT NULL,
    bag_temp_kammer double precision,
    bag_lf_kammer double precision,
    bag_substrat_type character varying,
    spawn_type character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.templates OWNER TO sopp;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: sopp
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.templates_id_seq OWNER TO sopp;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sopp
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: batch_info id; Type: DEFAULT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.batch_info ALTER COLUMN id SET DEFAULT nextval('public.batch_info_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: sensor_readings id; Type: DEFAULT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.sensor_readings ALTER COLUMN id SET DEFAULT nextval('public.sensor_readings_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Data for Name: batch_info; Type: TABLE DATA; Schema: public; Owner: sopp
--

COPY public.batch_info (id, batch_code, strain_name, lc_source, generation, notes, created_at) FROM stdin;
1	ØST-	Osterssopp		\N		2025-11-13 19:30:31.684068+00
2	ØST-B01-25	Osterssopp		\N		2025-11-13 19:30:31.684068+00
3	LM-B01-25	Lions Mane		\N		2025-11-13 19:30:31.684068+00
4	SH-B01-25	Shiitake		\N		2025-11-13 19:30:31.684068+00
5	LM-B02-25	Lions Mane		\N		2025-11-13 19:30:31.684068+00
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: sopp
--

COPY public.batches (id, strain, lc_kode, lc_vol, spawn_type, spawn_batch, spawn_dato_inok, spawn_kg, spawn_dager_ink, bag_forventet_kolon, bag_substrat_type, bag_kg_substrat, bag_dato_inok, bag_dager_ink, bag_status, bag_kontam, bag_frukting_start, bag_temp_kammer, bag_lf_kammer, bag_host1_start, bag_host1_slutt, bag_host1_total_kg, bag_host2_start, bag_host2_slutt, bag_syklus_lengde, bag_host2_total_kg, notater, archived, created_at, updated_at, batch_info_id) FROM stdin;
3	LIONSMANE	LMH1-190925		Grain spawn glass	LM-B02-25	2015-11-12 00:00:00	\N	3654	\N	Sagflis kli	\N	\N	0	INOKULERT	INGEN	\N	18	85	\N	\N	0	\N	\N	\N	0		f	2025-11-13 19:30:31.684068+00	\N	\N
4	SHIITAKE	SHH1-190925		Grain spawn glass	SH-B01-25	2025-10-22 00:00:00	\N	22	2025-11-12 00:00:00	Sagflis kli	\N	\N	0	INOKULERT	INGEN	\N	18	85	\N	\N	0	\N	\N	\N	0		f	2025-11-13 19:30:31.684068+00	\N	\N
6	OYSTER	GOH1-190925	\N	\N	ØST-B02-25	2025-11-22 00:00:00	\N	\N	\N	Sagflis kli	52	2025-11-29 00:00:00	\N	INOKULERT	INGEN	\N	\N	\N	\N	\N	0	\N	\N	\N	0	Test	f	2025-11-21 08:08:54.260283+00	2025-11-21 09:20:10.880246+00	\N
2	LIONSMANE	LMH1-190925		Grain spawn glass	LM-B01-25	2025-10-22 00:00:00	\N	22	2025-11-12 00:00:00	Sagflis kli	0	\N	0	INOKULERT	INGEN	\N	18	85	\N	\N	0	\N	\N	\N	0		f	2025-11-13 19:30:31.684068+00	2025-11-17 08:27:28.576038+00	\N
1	OYSTER	GOH1-190925		Grain spawn glass	ØST-B01-25	2025-10-22 00:00:00	\N	22	2025-12-06 00:00:00	Masters Mix	55	\N	0	INOKULERT	INGEN	\N	18	85	\N	\N	0	\N	\N	\N	0	dffsd	f	2025-11-13 19:30:31.684068+00	2025-11-21 09:27:29.224786+00	\N
7	OYSTER	asdfasd	\N	\N	adfa	\N	\N	\N	\N	\N	5.2	\N	\N	INOKULERT	INGEN	\N	\N	\N	\N	\N	0	\N	\N	\N	0	dasf	f	2025-11-21 09:28:19.12747+00	2025-11-21 09:39:09.170639+00	\N
8	OYSTER	fdgsgdf	5	Grain spawn glass	sdfgsdf	2025-11-21 00:00:00	0.3	\N	\N	\N	5.2	\N	\N	INOKULERT	INGEN	\N	18	85	\N	\N	0	\N	\N	\N	0	\N	f	2025-11-21 09:40:22.750596+00	2025-11-21 13:36:27.61471+00	\N
9	OYSTER	asdfa	\N	Grain spawn glass	adfa	\N	\N	\N	\N	\N	5.2	\N	\N	INOKULERT	INGEN	\N	\N	\N	\N	\N	0	\N	\N	\N	0		f	2025-11-21 13:36:02.963332+00	2025-11-21 13:36:30.788883+00	\N
\.


--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: sopp
--

COPY public.sensor_readings (id, sensor_type, location, value, unit, "timestamp") FROM stdin;
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: sopp
--

COPY public.templates (id, name, strain, bag_temp_kammer, bag_lf_kammer, bag_substrat_type, spawn_type, created_at) FROM stdin;
\.


--
-- Name: batch_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sopp
--

SELECT pg_catalog.setval('public.batch_info_id_seq', 5, true);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sopp
--

SELECT pg_catalog.setval('public.batches_id_seq', 9, true);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sopp
--

SELECT pg_catalog.setval('public.sensor_readings_id_seq', 1, false);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: sopp
--

SELECT pg_catalog.setval('public.templates_id_seq', 1, false);


--
-- Name: batch_info batch_info_pkey; Type: CONSTRAINT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.batch_info
    ADD CONSTRAINT batch_info_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: sensor_readings sensor_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: ix_batch_info_batch_code; Type: INDEX; Schema: public; Owner: sopp
--

CREATE UNIQUE INDEX ix_batch_info_batch_code ON public.batch_info USING btree (batch_code);


--
-- Name: ix_batch_info_id; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batch_info_id ON public.batch_info USING btree (id);


--
-- Name: ix_batches_archived; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_archived ON public.batches USING btree (archived);


--
-- Name: ix_batches_bag_dato_inok; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_bag_dato_inok ON public.batches USING btree (bag_dato_inok);


--
-- Name: ix_batches_bag_status; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_bag_status ON public.batches USING btree (bag_status);


--
-- Name: ix_batches_id; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_id ON public.batches USING btree (id);


--
-- Name: ix_batches_lc_kode; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_lc_kode ON public.batches USING btree (lc_kode);


--
-- Name: ix_batches_spawn_batch; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_spawn_batch ON public.batches USING btree (spawn_batch);


--
-- Name: ix_batches_strain; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_batches_strain ON public.batches USING btree (strain);


--
-- Name: ix_sensor_readings_id; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_sensor_readings_id ON public.sensor_readings USING btree (id);


--
-- Name: ix_sensor_readings_timestamp; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_sensor_readings_timestamp ON public.sensor_readings USING btree ("timestamp");


--
-- Name: ix_templates_id; Type: INDEX; Schema: public; Owner: sopp
--

CREATE INDEX ix_templates_id ON public.templates USING btree (id);


--
-- Name: batches batches_batch_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sopp
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_info_id_fkey FOREIGN KEY (batch_info_id) REFERENCES public.batch_info(id);


--
-- PostgreSQL database dump complete
--

\unrestrict SuFVkXWL1PhiVZucU02iTJ8R8Mc645CvwQUjwWvuliWeVo29MXdoGc803Ng5bqQ

