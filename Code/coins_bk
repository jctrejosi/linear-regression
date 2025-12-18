--
-- PostgreSQL database dump
--

\restrict j7mc5o5SegEhJpKiQZ2YMTzSsFgwXmQlvo9pLzQA5kYM1ic5AywhrbjDNJhYwna

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-18 18:16:17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16391)
-- Name: coin; Type: TABLE; Schema: public; Owner: jk
--

CREATE TABLE public.coin (
    id bigint CONSTRAINT currency_id_not_null NOT NULL,
    code character varying(255) CONSTRAINT currency_code_not_null NOT NULL,
    name character varying(255) CONSTRAINT currency_name_not_null NOT NULL,
    symbol character varying(255) CONSTRAINT currency_symbol_not_null NOT NULL,
    created_at timestamp with time zone DEFAULT now() CONSTRAINT currency_created_at_not_null NOT NULL,
    updated_at timestamp with time zone CONSTRAINT currency_updated_at_not_null NOT NULL
);


ALTER TABLE public.coin OWNER TO jk;

--
-- TOC entry 219 (class 1259 OID 16390)
-- Name: currency_id_seq; Type: SEQUENCE; Schema: public; Owner: jk
--

CREATE SEQUENCE public.currency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currency_id_seq OWNER TO jk;

--
-- TOC entry 4934 (class 0 OID 0)
-- Dependencies: 219
-- Name: currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jk
--

ALTER SEQUENCE public.currency_id_seq OWNED BY public.coin.id;


--
-- TOC entry 222 (class 1259 OID 16405)
-- Name: currency_rate; Type: TABLE; Schema: public; Owner: jk
--

CREATE TABLE public.currency_rate (
    id integer NOT NULL,
    coin_id bigint CONSTRAINT currency_rate_currency_id_not_null NOT NULL,
    rate_to_usd numeric NOT NULL,
    rate_to_co numeric NOT NULL,
    rate_date timestamp with time zone DEFAULT now() CONSTRAINT "currency_rate_rate_date _not_null" NOT NULL,
    origin text NOT NULL
);


ALTER TABLE public.currency_rate OWNER TO jk;

--
-- TOC entry 221 (class 1259 OID 16404)
-- Name: currency_rate_id_seq; Type: SEQUENCE; Schema: public; Owner: jk
--

CREATE SEQUENCE public.currency_rate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currency_rate_id_seq OWNER TO jk;

--
-- TOC entry 4935 (class 0 OID 0)
-- Dependencies: 221
-- Name: currency_rate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jk
--

ALTER SEQUENCE public.currency_rate_id_seq OWNED BY public.currency_rate.id;


--
-- TOC entry 223 (class 1259 OID 16433)
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- TOC entry 4764 (class 2604 OID 16420)
-- Name: coin id; Type: DEFAULT; Schema: public; Owner: jk
--

ALTER TABLE ONLY public.coin ALTER COLUMN id SET DEFAULT nextval('public.currency_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 16408)
-- Name: currency_rate id; Type: DEFAULT; Schema: public; Owner: jk
--

ALTER TABLE ONLY public.currency_rate ALTER COLUMN id SET DEFAULT nextval('public.currency_rate_id_seq'::regclass);


--
-- TOC entry 4925 (class 0 OID 16391)
-- Dependencies: 220
-- Data for Name: coin; Type: TABLE DATA; Schema: public; Owner: jk
--

COPY public.coin (id, code, name, symbol, created_at, updated_at) FROM stdin;
1	C	P	$	2025-12-18 13:47:37.043273-05	2025-12-18 13:47:37.043273-05
2	U	D	$	2025-12-18 13:47:37.043273-05	2025-12-18 13:47:37.043273-05
3	E	E	\\342	2025-12-18 13:47:37.043273-05	2025-12-18 13:47:37.043273-05
4	B	B	\\342	2025-12-18 13:53:28.106869-05	2025-12-18 13:53:28.106869-05
\.


--
-- TOC entry 4927 (class 0 OID 16405)
-- Dependencies: 222
-- Data for Name: currency_rate; Type: TABLE DATA; Schema: public; Owner: jk
--

COPY public.currency_rate (id, coin_id, rate_to_usd, rate_to_co, rate_date, origin) FROM stdin;
1	1	0.00021	1.0	2025-12-01 00:00:00-05	ficticio
2	1	0.00021	1.0	2025-12-02 00:00:00-05	ficticio
3	1	0.00022	1.0	2025-12-03 00:00:00-05	ficticio
4	1	0.00022	1.0	2025-12-04 00:00:00-05	ficticio
5	1	0.00023	1.0	2025-12-05 00:00:00-05	ficticio
6	1	0.00023	1.0	2025-12-06 00:00:00-05	ficticio
7	1	0.00024	1.0	2025-12-07 00:00:00-05	ficticio
8	1	0.00024	1.0	2025-12-08 00:00:00-05	ficticio
9	1	0.00025	1.0	2025-12-09 00:00:00-05	ficticio
10	1	0.00025	1.0	2025-12-10 00:00:00-05	ficticio
11	2	1.0	4800.0	2025-12-01 00:00:00-05	ficticio
12	2	1.0	4810.0	2025-12-02 00:00:00-05	ficticio
13	2	1.0	4820.0	2025-12-03 00:00:00-05	ficticio
14	2	1.0	4830.0	2025-12-04 00:00:00-05	ficticio
15	2	1.0	4840.0	2025-12-05 00:00:00-05	ficticio
16	2	1.0	4850.0	2025-12-06 00:00:00-05	ficticio
17	2	1.0	4860.0	2025-12-07 00:00:00-05	ficticio
18	2	1.0	4870.0	2025-12-08 00:00:00-05	ficticio
19	2	1.0	4880.0	2025-12-09 00:00:00-05	ficticio
20	2	1.0	4890.0	2025-12-10 00:00:00-05	ficticio
21	3	1.08	5184.0	2025-12-01 00:00:00-05	ficticio
22	3	1.07	5170.0	2025-12-02 00:00:00-05	ficticio
23	3	1.09	5200.0	2025-12-03 00:00:00-05	ficticio
24	3	1.08	5185.0	2025-12-04 00:00:00-05	ficticio
25	3	1.10	5220.0	2025-12-05 00:00:00-05	ficticio
26	3	1.09	5210.0	2025-12-06 00:00:00-05	ficticio
27	3	1.08	5190.0	2025-12-07 00:00:00-05	ficticio
28	3	1.07	5165.0	2025-12-08 00:00:00-05	ficticio
29	3	1.09	5205.0	2025-12-09 00:00:00-05	ficticio
30	3	1.08	5188.0	2025-12-10 00:00:00-05	ficticio
31	4	29000.00	125000000.00	2025-12-01 00:00:00-05	ficticio
32	4	29500.50	127000000.00	2025-12-02 00:00:00-05	ficticio
33	4	29250.75	126000000.00	2025-12-03 00:00:00-05	ficticio
34	4	29800.00	129000000.00	2025-12-04 00:00:00-05	ficticio
35	4	30000.25	130500000.00	2025-12-05 00:00:00-05	ficticio
36	4	29750.50	129500000.00	2025-12-06 00:00:00-05	ficticio
37	4	29900.00	130000000.00	2025-12-07 00:00:00-05	ficticio
38	4	30100.75	131000000.00	2025-12-08 00:00:00-05	ficticio
39	4	30300.50	132500000.00	2025-12-09 00:00:00-05	ficticio
40	4	30500.00	134000000.00	2025-12-10 00:00:00-05	ficticio
\.


--
-- TOC entry 4928 (class 0 OID 16433)
-- Dependencies: 223
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	<< Flyway Baseline >>	BASELINE	<< Flyway Baseline >>	\N	postgres	2025-12-18 14:13:44.70285	0	t
\.


--
-- TOC entry 4936 (class 0 OID 0)
-- Dependencies: 219
-- Name: currency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jk
--

SELECT pg_catalog.setval('public.currency_id_seq', 4, true);


--
-- TOC entry 4937 (class 0 OID 0)
-- Dependencies: 221
-- Name: currency_rate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jk
--

SELECT pg_catalog.setval('public.currency_rate_id_seq', 40, true);


--
-- TOC entry 4770 (class 2606 OID 16422)
-- Name: coin currency_pkey; Type: CONSTRAINT; Schema: public; Owner: jk
--

ALTER TABLE ONLY public.coin
    ADD CONSTRAINT currency_pkey PRIMARY KEY (id);


--
-- TOC entry 4772 (class 2606 OID 16418)
-- Name: currency_rate currency_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: jk
--

ALTER TABLE ONLY public.currency_rate
    ADD CONSTRAINT currency_rate_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 16448)
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- TOC entry 4775 (class 1259 OID 16449)
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- TOC entry 4776 (class 2606 OID 16428)
-- Name: currency_rate coin_id; Type: FK CONSTRAINT; Schema: public; Owner: jk
--

ALTER TABLE ONLY public.currency_rate
    ADD CONSTRAINT coin_id FOREIGN KEY (coin_id) REFERENCES public.coin(id) NOT VALID;


-- Completed on 2025-12-18 18:16:17

--
-- PostgreSQL database dump complete
--

\unrestrict j7mc5o5SegEhJpKiQZ2YMTzSsFgwXmQlvo9pLzQA5kYM1ic5AywhrbjDNJhYwna

