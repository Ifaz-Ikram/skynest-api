--
-- PostgreSQL database dump
--

\restrict 0LmlvcpOpJJjJKm9gAB870lB3nxwLg6strqn9YZBDxsGepGMvxN3wnJZ0ozaDM2

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-21 14:27:17

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

--
-- TOC entry 5513 (class 1262 OID 16387)
-- Name: skynest; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE skynest WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE skynest OWNER TO postgres;

\unrestrict 0LmlvcpOpJJjJKm9gAB870lB3nxwLg6strqn9YZBDxsGepGMvxN3wnJZ0ozaDM2
\connect skynest
\restrict 0LmlvcpOpJJjJKm9gAB870lB3nxwLg6strqn9YZBDxsGepGMvxN3wnJZ0ozaDM2

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

--
-- TOC entry 2 (class 3079 OID 16653)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 1119 (class 1247 OID 17807)
-- Name: adjustment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.adjustment_type AS ENUM (
    'refund',
    'chargeback',
    'manual_adjustment'
);


ALTER TYPE public.adjustment_type OWNER TO postgres;

--
-- TOC entry 1101 (class 1247 OID 16430)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'Booked',
    'Checked-In',
    'Checked-Out',
    'Cancelled'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- TOC entry 1095 (class 1247 OID 16412)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Card',
    'Online',
    'BankTransfer'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 1104 (class 1247 OID 16440)
-- Name: prebooking_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.prebooking_method AS ENUM (
    'Online',
    'Phone',
    'Walk-in'
);


ALTER TYPE public.prebooking_method OWNER TO postgres;

--
-- TOC entry 1098 (class 1247 OID 16422)
-- Name: room_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.room_status AS ENUM (
    'Available',
    'Occupied',
    'Maintenance',
    'Reserved'
);


ALTER TYPE public.room_status OWNER TO postgres;

--
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 1098
-- Name: TYPE room_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.room_status IS 'Room status: Available, Occupied, Maintenance, Out of Order, Reserved';


--
-- TOC entry 1092 (class 1247 OID 16400)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'Admin',
    'Manager',
    'Receptionist',
    'Accountant',
    'Customer'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 403 (class 1255 OID 28511)
-- Name: create_checkin_validation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_checkin_validation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only create validation record when booking status changes to 'Checked-In'
    IF NEW.status = 'Checked-In' AND (OLD.status IS NULL OR OLD.status != 'Checked-In') THEN
        -- Insert validation record for the guest
        INSERT INTO checkin_validation (booking_id, guest_id, validation_status)
        VALUES (NEW.booking_id, NEW.guest_id, 'pending')
        ON CONFLICT (booking_id, guest_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_checkin_validation() OWNER TO postgres;

--
-- TOC entry 367 (class 1255 OID 17775)
-- Name: fn_balance_due(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_balance_due(p bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
   SELECT ROUND(COALESCE(fn_bill_total(p),0) - COALESCE(fn_total_paid(p),0), 2);
$$;


ALTER FUNCTION public.fn_balance_due(p bigint) OWNER TO postgres;

--
-- TOC entry 463 (class 1255 OID 17831)
-- Name: fn_bill_total(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bill_total(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  WITH base AS (
    SELECT
      COALESCE(fn_room_charges(b.booking_id),0) +
      COALESCE(fn_service_charges(b.booking_id),0) +
      b.late_fee_amount - b.discount_amount AS subtotal,
      b.tax_rate_percent
    FROM booking b WHERE b.booking_id = p_booking_id
  )
  SELECT ROUND(subtotal * (1 + tax_rate_percent/100.0),2) FROM base;
$$;


ALTER FUNCTION public.fn_bill_total(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 273 (class 1255 OID 17837)
-- Name: fn_net_balance(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_net_balance(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT ROUND(
    COALESCE(fn_bill_total(p_booking_id),0)
    - (COALESCE(fn_total_paid(p_booking_id),0) - COALESCE(fn_total_refunds(p_booking_id),0))
  , 2);
$$;


ALTER FUNCTION public.fn_net_balance(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 385 (class 1255 OID 17828)
-- Name: fn_room_charges(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_room_charges(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT GREATEST((b.check_out_date - b.check_in_date),0)::int * b.booked_rate
  FROM booking b WHERE b.booking_id = p_booking_id;
$$;


ALTER FUNCTION public.fn_room_charges(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 417 (class 1255 OID 17829)
-- Name: fn_service_charges(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_service_charges(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(SUM(u.qty * u.unit_price_at_use),0)
  FROM service_usage u WHERE u.booking_id = p_booking_id;
$$;


ALTER FUNCTION public.fn_service_charges(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 17830)
-- Name: fn_total_paid(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_total_paid(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(SUM(p.amount),0) FROM payment p WHERE p.booking_id = p_booking_id;
$$;


ALTER FUNCTION public.fn_total_paid(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 291 (class 1255 OID 17832)
-- Name: fn_total_refunds(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_total_refunds(p_booking_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(SUM(amount),0)
  FROM payment_adjustment
  WHERE booking_id = p_booking_id AND type IN ('refund','chargeback');
$$;


ALTER FUNCTION public.fn_total_refunds(p_booking_id bigint) OWNER TO postgres;

--
-- TOC entry 461 (class 1255 OID 28526)
-- Name: get_next_room_number(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_next_room_number(branch_id_param bigint) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    next_number integer;
    branch_code_value text;
BEGIN
    -- Get branch code for prefix
    SELECT branch_code INTO branch_code_value 
    FROM branch 
    WHERE branch_id = branch_id_param;
    
    -- Get the next room number for this branch
    -- Updated regex to match branch code + number pattern (e.g., HQ001, CMB002)
    SELECT COALESCE(MAX(CAST(SUBSTRING(room_number FROM '[0-9]+$') AS integer)), 0) + 1
    INTO next_number
    FROM room 
    WHERE room.branch_id = branch_id_param 
    AND room_number ~ ('^' || COALESCE(branch_code_value, 'R') || '[0-9]+$');
    
    -- Return the formatted room number
    RETURN COALESCE(branch_code_value, 'R') || LPAD(next_number::text, 3, '0');
END;
$_$;


ALTER FUNCTION public.get_next_room_number(branch_id_param bigint) OWNER TO postgres;

--
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 461
-- Name: FUNCTION get_next_room_number(branch_id_param bigint); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_next_room_number(branch_id_param bigint) IS 'Generates the next sequential room number for a given branch';


--
-- TOC entry 469 (class 1255 OID 17776)
-- Name: randn(numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.randn(p numeric) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT (random() * p)::numeric;
$$;


ALTER FUNCTION public.randn(p numeric) OWNER TO postgres;

--
-- TOC entry 474 (class 1255 OID 28527)
-- Name: set_room_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_room_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only set room_number if it's empty or null
    IF NEW.room_number IS NULL OR NEW.room_number = '' THEN
        NEW.room_number := get_next_room_number(NEW.branch_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_room_number() OWNER TO postgres;

--
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION set_room_number(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.set_room_number() IS 'Trigger function to automatically assign room numbers';


--
-- TOC entry 406 (class 1255 OID 17838)
-- Name: sp_cancel_booking(bigint, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_cancel_booking(p_booking_id bigint, p_reference_note character varying DEFAULT NULL::character varying) RETURNS TABLE(booking_id bigint, bill_total numeric, total_paid numeric, cancellation_fee numeric, refund_amount numeric, status_after text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_bill   NUMERIC;
  v_paid   NUMERIC;
  v_fee    NUMERIC := 0;
  v_refund NUMERIC := 0;
  v_checkin DATE;
  v_today   DATE := CURRENT_DATE;
  v_status  booking_status;
BEGIN
  -- 1) Load current facts
  SELECT check_in_date, status INTO v_checkin, v_status
  FROM booking WHERE booking_id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % not found', p_booking_id;
  END IF;

  v_bill := COALESCE(fn_bill_total(p_booking_id),0);
  v_paid := COALESCE(fn_total_paid(p_booking_id),0);

  -- 2) Policy: free >= 2 days before check-in; else 10% fee
  IF v_checkin - v_today >= 2 THEN
    v_fee := 0;
  ELSE
    v_fee := ROUND(v_bill * 0.10, 2);  -- 10% fee
  END IF;

  -- Never refund more than bill total minus fee (and not more than paid)
  v_refund := GREATEST(LEAST(v_paid, GREATEST(v_bill - v_fee, 0)), 0);

  -- 3) Record refund only if there is something to refund
  IF v_refund > 0 THEN
    INSERT INTO payment_adjustment (booking_id, amount, type, reference_note)
    VALUES (p_booking_id, v_refund, 'refund', COALESCE(p_reference_note, 'auto-refund on cancel'));
  END IF;

  -- 4) Set status to Cancelled (idempotent)
  UPDATE booking
  SET status = 'Cancelled'
  WHERE booking_id = p_booking_id;

  -- 5) Return a summary row
  RETURN QUERY
  SELECT p_booking_id, v_bill, v_paid, v_fee, v_refund, 'Cancelled'::text;
END $$;


ALTER FUNCTION public.sp_cancel_booking(p_booking_id bigint, p_reference_note character varying) OWNER TO postgres;

--
-- TOC entry 357 (class 1255 OID 17854)
-- Name: trg_check_min_advance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_check_min_advance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_required numeric(10,2);
BEGIN
  v_required := ROUND(
    (GREATEST((NEW.check_out_date - NEW.check_in_date), 0)::int * NEW.booked_rate) * 0.10, 2
  );

  IF NEW.advance_payment < v_required THEN
    RAISE EXCEPTION
      'advance_payment (%.2f) is below the required 10%% (%.2f) of room charges (nights × rate)',
      NEW.advance_payment, v_required
      USING ERRCODE = '23514';  -- check_violation
  END IF;

  RETURN NEW;
END $$;


ALTER FUNCTION public.trg_check_min_advance() OWNER TO postgres;

--
-- TOC entry 299 (class 1255 OID 17839)
-- Name: trg_refund_advance_on_cancel(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_refund_advance_on_cancel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_adv NUMERIC;
BEGIN
  IF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' THEN
    v_adv := COALESCE(NEW.advance_payment,0);
    IF v_adv > 0 THEN
      INSERT INTO payment_adjustment (booking_id, amount, type, reference_note)
      VALUES (NEW.booking_id, v_adv, 'refund', 'Auto refund of advance on cancel');
    END IF;
  END IF;
  RETURN NEW;
END $$;


ALTER FUNCTION public.trg_refund_advance_on_cancel() OWNER TO postgres;

--
-- TOC entry 373 (class 1255 OID 17844)
-- Name: trg_refund_advance_policy(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_refund_advance_policy() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_checkin  DATE;
  v_today    DATE := CURRENT_DATE;
  v_adv      NUMERIC;
  v_fee      NUMERIC;
  v_refund   NUMERIC;
BEGIN
  -- Run only when status just changed to Cancelled
  IF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' THEN
    v_checkin := NEW.check_in_date;
    v_adv     := COALESCE(NEW.advance_payment,0);

    IF v_adv > 0 THEN
      -- Rule: full refund if ≥2 days before check-in, else 10 % fee
      IF v_checkin - v_today >= 2 THEN
        v_fee := 0;
      ELSE
        v_fee := ROUND(v_adv * 0.10,2);     -- 10 % fee
      END IF;

      v_refund := GREATEST(v_adv - v_fee,0);

      INSERT INTO payment_adjustment(booking_id,amount,type,reference_note)
      VALUES(NEW.booking_id,v_refund,'refund',
             CASE WHEN v_fee=0
                  THEN 'Full advance refund (≥2 days before check-in)'
                  ELSE 'Refund after 10 % late-cancel fee'
             END);
    END IF;
  END IF;

  RETURN NEW;
END $$;


ALTER FUNCTION public.trg_refund_advance_policy() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 27109)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    audit_id integer NOT NULL,
    actor text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id bigint,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 27115)
-- Name: audit_log_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5518 (class 0 OID 0)
-- Dependencies: 221
-- Name: audit_log_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_audit_id_seq OWNED BY public.audit_log.audit_id;


--
-- TOC entry 222 (class 1259 OID 27116)
-- Name: booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking (
    booking_id bigint NOT NULL,
    pre_booking_id bigint,
    guest_id bigint NOT NULL,
    room_id bigint NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    status public.booking_status DEFAULT 'Booked'::public.booking_status NOT NULL,
    booked_rate numeric(10,2) NOT NULL,
    tax_rate_percent numeric(5,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    late_fee_amount numeric(10,2) DEFAULT 0 NOT NULL,
    preferred_payment_method public.payment_method,
    advance_payment numeric(10,2) DEFAULT 0 NOT NULL,
    room_estimate numeric(10,2) GENERATED ALWAYS AS (((GREATEST((check_out_date - check_in_date), 0))::numeric * booked_rate)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    branch_id character varying(50) DEFAULT 'colombo'::character varying,
    group_name character varying(100),
    is_group_booking boolean DEFAULT false NOT NULL,
    group_booking_id bigint,
    CONSTRAINT booking_advance_min_10pct CHECK (((advance_payment + 0.005) >= round((((GREATEST((check_out_date - check_in_date), 0))::numeric * booked_rate) * 0.10), 2))),
    CONSTRAINT check_branch_id CHECK (((branch_id)::text = ANY ((ARRAY['colombo'::character varying, 'galle'::character varying, 'kandy'::character varying, 'negombo'::character varying, 'all'::character varying])::text[]))),
    CONSTRAINT chk_booking_dates_valid CHECK ((check_out_date > check_in_date)),
    CONSTRAINT chk_booking_rate_positive CHECK ((booked_rate > (0)::numeric)),
    CONSTRAINT chk_group_booking_logic CHECK ((((is_group_booking = true) AND (group_name IS NOT NULL)) OR ((is_group_booking = false) AND (group_name IS NULL)))),
    CONSTRAINT chk_tax_rate_valid CHECK (((tax_rate_percent >= (0)::numeric) AND (tax_rate_percent <= (100)::numeric)))
);


ALTER TABLE public.booking OWNER TO postgres;

--
-- TOC entry 5519 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN booking.branch_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.booking.branch_id IS 'Branch identifier for multi-location filtering (colombo, galle, kandy, negombo)';


--
-- TOC entry 5520 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN booking.is_group_booking; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.booking.is_group_booking IS 'Flag indicating if this booking is part of a group';


--
-- TOC entry 5521 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN booking.group_booking_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.booking.group_booking_id IS 'Reference to group booking if this is part of a group reservation';


--
-- TOC entry 223 (class 1259 OID 27127)
-- Name: booking_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.booking_booking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booking_booking_id_seq OWNER TO postgres;

--
-- TOC entry 5522 (class 0 OID 0)
-- Dependencies: 223
-- Name: booking_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.booking_booking_id_seq OWNED BY public.booking.booking_id;


--
-- TOC entry 224 (class 1259 OID 27128)
-- Name: branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch (
    branch_id bigint NOT NULL,
    branch_name character varying(100) NOT NULL,
    contact_number character varying(30),
    address text,
    manager_name character varying(100),
    branch_code character varying(10)
);


ALTER TABLE public.branch OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 27133)
-- Name: branch_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_branch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_branch_id_seq OWNER TO postgres;

--
-- TOC entry 5523 (class 0 OID 0)
-- Dependencies: 225
-- Name: branch_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_branch_id_seq OWNED BY public.branch.branch_id;


--
-- TOC entry 258 (class 1259 OID 28481)
-- Name: checkin_validation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkin_validation (
    validation_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    guest_id bigint NOT NULL,
    id_proof_type character varying(50),
    id_proof_number character varying(50),
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    validated_at timestamp with time zone,
    validated_by_employee_id bigint,
    validation_notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT checkin_validation_validation_status_check CHECK (((validation_status)::text = ANY ((ARRAY['pending'::character varying, 'validated'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.checkin_validation OWNER TO postgres;

--
-- TOC entry 5524 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE checkin_validation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.checkin_validation IS 'Tracks ID proof validation requirements for check-in process';


--
-- TOC entry 5525 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN checkin_validation.validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.checkin_validation.validation_status IS 'Status of ID proof validation: pending, validated, failed';


--
-- TOC entry 5526 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN checkin_validation.validated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.checkin_validation.validated_at IS 'Timestamp when validation was completed';


--
-- TOC entry 5527 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN checkin_validation.validation_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.checkin_validation.validation_notes IS 'Additional notes about the validation process';


--
-- TOC entry 257 (class 1259 OID 28480)
-- Name: checkin_validation_validation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.checkin_validation ALTER COLUMN validation_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.checkin_validation_validation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 27134)
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    customer_id bigint NOT NULL,
    user_id bigint,
    guest_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 27138)
-- Name: customer_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_customer_id_seq OWNER TO postgres;

--
-- TOC entry 5528 (class 0 OID 0)
-- Dependencies: 227
-- Name: customer_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_customer_id_seq OWNED BY public.customer.customer_id;


--
-- TOC entry 228 (class 1259 OID 27139)
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    employee_id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    contact_no character varying(30) NOT NULL
);


ALTER TABLE public.employee OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 27142)
-- Name: employee_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_employee_id_seq OWNER TO postgres;

--
-- TOC entry 5529 (class 0 OID 0)
-- Dependencies: 229
-- Name: employee_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_employee_id_seq OWNED BY public.employee.employee_id;


--
-- TOC entry 256 (class 1259 OID 28453)
-- Name: group_booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_booking (
    group_booking_id bigint NOT NULL,
    group_name character varying(100) NOT NULL,
    group_contact_person character varying(120) NOT NULL,
    group_contact_phone character varying(30),
    group_contact_email character varying(150),
    group_notes text,
    total_guests integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by_employee_id bigint,
    branch_id character varying(50) DEFAULT 'colombo'::character varying
);


ALTER TABLE public.group_booking OWNER TO postgres;

--
-- TOC entry 5530 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE group_booking; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.group_booking IS 'Manages group reservations with multiple guests';


--
-- TOC entry 5531 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN group_booking.group_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.group_booking.group_name IS 'Name of the group/organization';


--
-- TOC entry 5532 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN group_booking.group_contact_person; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.group_booking.group_contact_person IS 'Primary contact person for the group';


--
-- TOC entry 5533 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN group_booking.total_guests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.group_booking.total_guests IS 'Total number of guests in the group';


--
-- TOC entry 255 (class 1259 OID 28452)
-- Name: group_booking_group_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.group_booking ALTER COLUMN group_booking_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.group_booking_group_booking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 27143)
-- Name: guest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest (
    guest_id bigint NOT NULL,
    full_name character varying(120) NOT NULL,
    email character varying(150),
    phone character varying(30),
    gender character varying(20),
    date_of_birth date,
    address text,
    nationality character varying(80),
    id_proof_type character varying(50) NOT NULL,
    id_proof_number character varying(50) NOT NULL
);


ALTER TABLE public.guest OWNER TO postgres;

--
-- TOC entry 5534 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN guest.id_proof_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guest.id_proof_type IS 'Type of ID proof (NIC, Passport, Driving License, Other) - REQUIRED';


--
-- TOC entry 5535 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN guest.id_proof_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guest.id_proof_number IS 'ID proof number - REQUIRED';


--
-- TOC entry 231 (class 1259 OID 27148)
-- Name: guest_guest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_guest_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_guest_id_seq OWNER TO postgres;

--
-- TOC entry 5536 (class 0 OID 0)
-- Dependencies: 231
-- Name: guest_guest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_guest_id_seq OWNED BY public.guest.guest_id;


--
-- TOC entry 260 (class 1259 OID 28514)
-- Name: id_validation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.id_validation_rules (
    rule_id bigint NOT NULL,
    guest_type character varying(50) NOT NULL,
    requires_id_proof boolean DEFAULT true,
    required_id_types text[],
    validation_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.id_validation_rules OWNER TO postgres;

--
-- TOC entry 5537 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE id_validation_rules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.id_validation_rules IS 'Defines ID proof requirements for different guest types';


--
-- TOC entry 5538 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN id_validation_rules.guest_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.id_validation_rules.guest_type IS 'Type of guest (local, foreign, diplomatic, minor)';


--
-- TOC entry 5539 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN id_validation_rules.required_id_types; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.id_validation_rules.required_id_types IS 'Array of accepted ID proof types for this guest type';


--
-- TOC entry 259 (class 1259 OID 28513)
-- Name: id_validation_rules_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.id_validation_rules ALTER COLUMN rule_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.id_validation_rules_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 27149)
-- Name: invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice (
    invoice_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    period_start date,
    period_end date,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invoice OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 27153)
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_invoice_id_seq OWNER TO postgres;

--
-- TOC entry 5540 (class 0 OID 0)
-- Dependencies: 233
-- Name: invoice_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_invoice_id_seq OWNED BY public.invoice.invoice_id;


--
-- TOC entry 234 (class 1259 OID 27154)
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    payment_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    method public.payment_method,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_reference character varying(100),
    CONSTRAINT chk_payment_amount_positive CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- TOC entry 5541 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN payment.paid_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment.paid_at IS 'Payment date - compulsory field, defaults to current timestamp';


--
-- TOC entry 235 (class 1259 OID 27158)
-- Name: payment_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_adjustment (
    adjustment_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    type public.adjustment_type NOT NULL,
    reference_note character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_adjustment_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payment_adjustment OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 27163)
-- Name: payment_adjustment_adjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_adjustment_adjustment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_adjustment_adjustment_id_seq OWNER TO postgres;

--
-- TOC entry 5542 (class 0 OID 0)
-- Dependencies: 236
-- Name: payment_adjustment_adjustment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_adjustment_adjustment_id_seq OWNED BY public.payment_adjustment.adjustment_id;


--
-- TOC entry 237 (class 1259 OID 27164)
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5543 (class 0 OID 0)
-- Dependencies: 237
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- TOC entry 238 (class 1259 OID 27165)
-- Name: pre_booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pre_booking (
    pre_booking_id bigint NOT NULL,
    guest_id bigint NOT NULL,
    capacity integer NOT NULL,
    prebooking_method public.prebooking_method NOT NULL,
    expected_check_in date NOT NULL,
    expected_check_out date NOT NULL,
    room_id bigint,
    created_by_employee_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id bigint,
    room_type_id bigint,
    group_name character varying(100),
    group_contact_person character varying(120),
    group_contact_phone character varying(30),
    group_contact_email character varying(150),
    is_group_booking boolean DEFAULT false,
    group_notes text,
    number_of_rooms integer DEFAULT 1,
    status character varying(20) DEFAULT 'Pending'::character varying,
    special_requests text,
    auto_cancel_date date,
    branch_id bigint,
    CONSTRAINT chk_prebooking_number_of_rooms CHECK ((number_of_rooms > 0)),
    CONSTRAINT chk_prebooking_status CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Confirmed'::character varying, 'Cancelled'::character varying, 'Converted'::character varying])::text[])))
);


ALTER TABLE public.pre_booking OWNER TO postgres;

--
-- TOC entry 5544 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.guest_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.guest_id IS 'Original guest/customer reference (for backward compatibility)';


--
-- TOC entry 5545 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.customer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.customer_id IS 'Customer who made the booking (may differ from guest)';


--
-- TOC entry 5546 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.room_type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.room_type_id IS 'Requested room type for this pre-booking (required)';


--
-- TOC entry 5547 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.group_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.group_name IS 'Name for the group booking';


--
-- TOC entry 5548 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.is_group_booking; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.is_group_booking IS 'Whether this is a group booking (multiple rooms)';


--
-- TOC entry 5549 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.number_of_rooms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.number_of_rooms IS 'Number of rooms needed for this pre-booking';


--
-- TOC entry 5550 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.status IS 'Pre-booking status: Pending, Confirmed, Cancelled, Converted';


--
-- TOC entry 5551 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.special_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.special_requests IS 'Customer special requests and notes';


--
-- TOC entry 5552 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.auto_cancel_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.auto_cancel_date IS 'Date when pre-booking should be auto-cancelled (7 days before check-in)';


--
-- TOC entry 5553 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN pre_booking.branch_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pre_booking.branch_id IS 'Branch where the pre-booking is made';


--
-- TOC entry 239 (class 1259 OID 27169)
-- Name: pre_booking_pre_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pre_booking_pre_booking_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pre_booking_pre_booking_id_seq OWNER TO postgres;

--
-- TOC entry 5554 (class 0 OID 0)
-- Dependencies: 239
-- Name: pre_booking_pre_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pre_booking_pre_booking_id_seq OWNED BY public.pre_booking.pre_booking_id;


--
-- TOC entry 240 (class 1259 OID 27170)
-- Name: room; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room (
    room_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    room_type_id bigint NOT NULL,
    room_number character varying(20) NOT NULL,
    status public.room_status DEFAULT 'Available'::public.room_status NOT NULL
);


ALTER TABLE public.room OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 27174)
-- Name: room_room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_room_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_room_id_seq OWNER TO postgres;

--
-- TOC entry 5555 (class 0 OID 0)
-- Dependencies: 241
-- Name: room_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_room_id_seq OWNED BY public.room.room_id;


--
-- TOC entry 242 (class 1259 OID 27175)
-- Name: room_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_type (
    room_type_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    capacity integer NOT NULL,
    daily_rate numeric(10,2) NOT NULL,
    amenities text
);


ALTER TABLE public.room_type OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 27180)
-- Name: room_type_room_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_type_room_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_type_room_type_id_seq OWNER TO postgres;

--
-- TOC entry 5556 (class 0 OID 0)
-- Dependencies: 243
-- Name: room_type_room_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_type_room_type_id_seq OWNED BY public.room_type.room_type_id;


--
-- TOC entry 244 (class 1259 OID 27181)
-- Name: service_catalog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_catalog (
    service_id bigint NOT NULL,
    code character varying(30),
    name character varying(100) NOT NULL,
    category character varying(60),
    unit_price numeric(10,2) NOT NULL,
    tax_rate_percent numeric(5,2) DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.service_catalog OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 27186)
-- Name: service_catalog_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_catalog_service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_catalog_service_id_seq OWNER TO postgres;

--
-- TOC entry 5557 (class 0 OID 0)
-- Dependencies: 245
-- Name: service_catalog_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_catalog_service_id_seq OWNED BY public.service_catalog.service_id;


--
-- TOC entry 246 (class 1259 OID 27187)
-- Name: service_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_usage (
    service_usage_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    service_id bigint NOT NULL,
    used_on date DEFAULT CURRENT_DATE NOT NULL,
    qty integer NOT NULL,
    unit_price_at_use numeric(10,2) NOT NULL
);


ALTER TABLE public.service_usage OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 27191)
-- Name: service_usage_service_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_usage_service_usage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_usage_service_usage_id_seq OWNER TO postgres;

--
-- TOC entry 5558 (class 0 OID 0)
-- Dependencies: 247
-- Name: service_usage_service_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_usage_service_usage_id_seq OWNED BY public.service_usage.service_usage_id;


--
-- TOC entry 248 (class 1259 OID 27192)
-- Name: user_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_account (
    user_id bigint NOT NULL,
    username character varying(60) NOT NULL,
    password_hash character varying(100) NOT NULL,
    role public.user_role NOT NULL,
    guest_id bigint
);


ALTER TABLE public.user_account OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 27195)
-- Name: user_account_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_account_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_account_user_id_seq OWNER TO postgres;

--
-- TOC entry 5559 (class 0 OID 0)
-- Dependencies: 249
-- Name: user_account_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_account_user_id_seq OWNED BY public.user_account.user_id;


--
-- TOC entry 250 (class 1259 OID 27196)
-- Name: vw_billing_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_billing_summary AS
 WITH calc AS (
         SELECT b_1.booking_id,
            (b_1.check_out_date - b_1.check_in_date) AS nights,
            (((b_1.check_out_date - b_1.check_in_date))::numeric * b_1.booked_rate) AS room_total,
            COALESCE(sum(((u.qty)::numeric * u.unit_price_at_use)), (0)::numeric) AS service_total,
            b_1.discount_amount,
            b_1.late_fee_amount,
            b_1.tax_rate_percent
           FROM (public.booking b_1
             LEFT JOIN public.service_usage u ON ((u.booking_id = b_1.booking_id)))
          GROUP BY b_1.booking_id, (b_1.check_out_date - b_1.check_in_date), (((b_1.check_out_date - b_1.check_in_date))::numeric * b_1.booked_rate), b_1.discount_amount, b_1.late_fee_amount, b_1.tax_rate_percent
        ), paid AS (
         SELECT payment.booking_id,
            COALESCE(sum(payment.amount), (0)::numeric) AS total_paid
           FROM public.payment
          GROUP BY payment.booking_id
        )
 SELECT b.booking_id,
    g.full_name AS guest,
    br.branch_name,
    r.room_number,
    c.nights,
    c.room_total,
    c.service_total,
    round(((((c.room_total + c.service_total) + b.late_fee_amount) - b.discount_amount) * ((1)::numeric + (b.tax_rate_percent / 100.0))), 2) AS total_bill,
    COALESCE(p.total_paid, (0)::numeric) AS total_paid,
    round((((((c.room_total + c.service_total) + b.late_fee_amount) - b.discount_amount) * ((1)::numeric + (b.tax_rate_percent / 100.0))) - COALESCE(p.total_paid, (0)::numeric)), 2) AS balance_due,
    b.status
   FROM (((((calc c
     JOIN public.booking b ON ((b.booking_id = c.booking_id)))
     JOIN public.guest g ON ((g.guest_id = b.guest_id)))
     JOIN public.room r ON ((r.room_id = b.room_id)))
     JOIN public.branch br ON ((br.branch_id = r.branch_id)))
     LEFT JOIN paid p ON ((p.booking_id = b.booking_id)));


ALTER VIEW public.vw_billing_summary OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 27201)
-- Name: vw_service_usage_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_service_usage_detail AS
 SELECT u.service_usage_id,
    u.used_on,
    br.branch_name,
    r.room_number,
    b.booking_id,
    sc.code AS service_code,
    sc.name AS service_name,
    u.qty,
    u.unit_price_at_use,
    ((u.qty)::numeric * u.unit_price_at_use) AS line_total
   FROM ((((public.service_usage u
     JOIN public.booking b ON ((b.booking_id = u.booking_id)))
     JOIN public.room r ON ((r.room_id = b.room_id)))
     JOIN public.branch br ON ((br.branch_id = r.branch_id)))
     JOIN public.service_catalog sc ON ((sc.service_id = u.service_id)));


ALTER VIEW public.vw_service_usage_detail OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 27206)
-- Name: vw_branch_revenue_monthly; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_branch_revenue_monthly AS
 WITH room_days AS (
         SELECT br.branch_name,
            (date_trunc('day'::text, dd.dd))::date AS day,
            b.booking_id,
            (b.booked_rate)::numeric AS room_rate
           FROM (((public.booking b
             JOIN public.room r ON ((r.room_id = b.room_id)))
             JOIN public.branch br ON ((br.branch_id = r.branch_id)))
             JOIN LATERAL generate_series((b.check_in_date)::timestamp without time zone, (b.check_out_date - '1 day'::interval), '1 day'::interval) dd(dd) ON (true))
          WHERE (b.status = ANY (ARRAY['Booked'::public.booking_status, 'Checked-In'::public.booking_status, 'Checked-Out'::public.booking_status]))
        ), room_month AS (
         SELECT (date_trunc('month'::text, (room_days.day)::timestamp with time zone))::date AS month,
            room_days.branch_name,
            count(*) AS nights_in_month,
            sum(room_days.room_rate) AS room_revenue
           FROM room_days
          GROUP BY ((date_trunc('month'::text, (room_days.day)::timestamp with time zone))::date), room_days.branch_name
        ), service_month AS (
         SELECT (date_trunc('month'::text, (d.used_on)::timestamp with time zone))::date AS month,
            br.branch_name,
            COALESCE(sum(d.line_total), (0)::numeric) AS service_revenue
           FROM (public.vw_service_usage_detail d
             JOIN public.branch br ON (((br.branch_name)::text = (d.branch_name)::text)))
          GROUP BY ((date_trunc('month'::text, (d.used_on)::timestamp with time zone))::date), br.branch_name
        )
 SELECT COALESCE(rm.month, sm.month) AS month,
    COALESCE(rm.branch_name, sm.branch_name) AS branch_name,
    COALESCE(rm.nights_in_month, (0)::bigint) AS nights_in_month,
    COALESCE(rm.room_revenue, (0)::numeric) AS room_revenue,
    COALESCE(sm.service_revenue, (0)::numeric) AS service_revenue,
    (COALESCE(rm.room_revenue, (0)::numeric) + COALESCE(sm.service_revenue, (0)::numeric)) AS total_revenue
   FROM (room_month rm
     FULL JOIN service_month sm ON (((sm.month = rm.month) AND ((sm.branch_name)::text = (rm.branch_name)::text))));


ALTER VIEW public.vw_branch_revenue_monthly OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 27211)
-- Name: vw_occupancy_by_day; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_occupancy_by_day AS
 SELECT (d.day)::date AS day,
    br.branch_name,
    r.room_number,
    b.booking_id,
    g.full_name AS guest,
    b.status
   FROM ((((public.booking b
     JOIN public.room r ON ((r.room_id = b.room_id)))
     JOIN public.branch br ON ((br.branch_id = r.branch_id)))
     JOIN public.guest g ON ((g.guest_id = b.guest_id)))
     JOIN LATERAL generate_series((b.check_in_date)::timestamp without time zone, (b.check_out_date - '1 day'::interval), '1 day'::interval) d(day) ON (true))
  WHERE (b.status = ANY (ARRAY['Booked'::public.booking_status, 'Checked-In'::public.booking_status, 'Checked-Out'::public.booking_status]));


ALTER VIEW public.vw_occupancy_by_day OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 27216)
-- Name: vw_service_monthly_trend; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_service_monthly_trend AS
 SELECT (date_trunc('month'::text, (used_on)::timestamp with time zone))::date AS month,
    service_code,
    service_name,
    sum(qty) AS total_qty,
    sum(line_total) AS total_revenue
   FROM public.vw_service_usage_detail
  GROUP BY ((date_trunc('month'::text, (used_on)::timestamp with time zone))::date), service_code, service_name;


ALTER VIEW public.vw_service_monthly_trend OWNER TO postgres;

--
-- TOC entry 5147 (class 2604 OID 27220)
-- Name: audit_log audit_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN audit_id SET DEFAULT nextval('public.audit_log_audit_id_seq'::regclass);


--
-- TOC entry 5149 (class 2604 OID 27221)
-- Name: booking booking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking ALTER COLUMN booking_id SET DEFAULT nextval('public.booking_booking_id_seq'::regclass);


--
-- TOC entry 5159 (class 2604 OID 27222)
-- Name: branch branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch ALTER COLUMN branch_id SET DEFAULT nextval('public.branch_branch_id_seq'::regclass);


--
-- TOC entry 5160 (class 2604 OID 27223)
-- Name: customer customer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer ALTER COLUMN customer_id SET DEFAULT nextval('public.customer_customer_id_seq'::regclass);


--
-- TOC entry 5162 (class 2604 OID 27224)
-- Name: employee employee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee ALTER COLUMN employee_id SET DEFAULT nextval('public.employee_employee_id_seq'::regclass);


--
-- TOC entry 5163 (class 2604 OID 27225)
-- Name: guest guest_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest ALTER COLUMN guest_id SET DEFAULT nextval('public.guest_guest_id_seq'::regclass);


--
-- TOC entry 5164 (class 2604 OID 27226)
-- Name: invoice invoice_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoice_invoice_id_seq'::regclass);


--
-- TOC entry 5166 (class 2604 OID 27227)
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- TOC entry 5168 (class 2604 OID 27228)
-- Name: payment_adjustment adjustment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustment ALTER COLUMN adjustment_id SET DEFAULT nextval('public.payment_adjustment_adjustment_id_seq'::regclass);


--
-- TOC entry 5170 (class 2604 OID 27229)
-- Name: pre_booking pre_booking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking ALTER COLUMN pre_booking_id SET DEFAULT nextval('public.pre_booking_pre_booking_id_seq'::regclass);


--
-- TOC entry 5175 (class 2604 OID 27230)
-- Name: room room_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room ALTER COLUMN room_id SET DEFAULT nextval('public.room_room_id_seq'::regclass);


--
-- TOC entry 5177 (class 2604 OID 27231)
-- Name: room_type room_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_type ALTER COLUMN room_type_id SET DEFAULT nextval('public.room_type_room_type_id_seq'::regclass);


--
-- TOC entry 5178 (class 2604 OID 27232)
-- Name: service_catalog service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_catalog ALTER COLUMN service_id SET DEFAULT nextval('public.service_catalog_service_id_seq'::regclass);


--
-- TOC entry 5181 (class 2604 OID 27233)
-- Name: service_usage service_usage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_usage ALTER COLUMN service_usage_id SET DEFAULT nextval('public.service_usage_service_usage_id_seq'::regclass);


--
-- TOC entry 5183 (class 2604 OID 27234)
-- Name: user_account user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account ALTER COLUMN user_id SET DEFAULT nextval('public.user_account_user_id_seq'::regclass);


--
-- TOC entry 5472 (class 0 OID 27109)
-- Dependencies: 220
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5474 (class 0 OID 27116)
-- Dependencies: 222
-- Data for Name: booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.booking VALUES (1, NULL, 1, 3, '2025-10-19', '2025-10-23', 'Checked-In', 8500.00, 10.00, 0.00, 0.00, 'Card', 3400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (2, NULL, 11, 11, '2025-10-20', '2025-10-25', 'Checked-In', 12500.00, 10.00, 500.00, 0.00, 'Online', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (3, NULL, 23, 17, '2025-10-18', '2025-10-22', 'Checked-In', 18500.00, 10.00, 0.00, 0.00, 'Card', 7400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (4, NULL, 3, 34, '2025-10-20', '2025-10-24', 'Checked-In', 8500.00, 10.00, 0.00, 0.00, 'Cash', 3400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (5, NULL, 13, 42, '2025-10-19', '2025-10-23', 'Checked-In', 12500.00, 10.00, 1000.00, 0.00, 'Card', 5000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (6, NULL, 18, 48, '2025-10-21', '2025-10-25', 'Checked-In', 18500.00, 10.00, 0.00, 0.00, 'Online', 7400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (7, NULL, 5, 69, '2025-10-20', '2025-10-24', 'Checked-In', 8500.00, 10.00, 0.00, 0.00, 'Cash', 3400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (8, NULL, 12, 72, '2025-10-19', '2025-10-22', 'Checked-In', 12500.00, 10.00, 0.00, 0.00, 'Card', 3750.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (9, NULL, 21, 81, '2025-10-18', '2025-10-23', 'Checked-In', 22000.00, 10.00, 0.00, 0.00, 'Online', 11000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, 2);
INSERT INTO public.booking VALUES (10, NULL, 4, 96, '2025-10-20', '2025-10-23', 'Checked-In', 8500.00, 10.00, 0.00, 0.00, 'Card', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'negombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (11, NULL, 15, 103, '2025-10-19', '2025-10-24', 'Checked-In', 12500.00, 10.00, 0.00, 0.00, 'Online', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'negombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (12, NULL, 20, 120, '2025-10-18', '2025-10-22', 'Checked-In', 35000.00, 10.00, 2000.00, 0.00, 'Card', 14000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'negombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (13, NULL, 2, 5, '2025-10-25', '2025-10-28', 'Booked', 8500.00, 10.00, 0.00, 0.00, 'Online', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (14, NULL, 14, 10, '2025-10-27', '2025-10-30', 'Booked', 12500.00, 10.00, 0.00, 0.00, 'Card', 3750.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (15, NULL, 16, 30, '2025-10-26', '2025-10-29', 'Booked', 25000.00, 10.00, 0.00, 0.00, 'Online', 7500.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (16, NULL, 6, 36, '2025-10-25', '2025-10-27', 'Booked', 8500.00, 10.00, 0.00, 0.00, 'Cash', 1700.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (17, NULL, 17, 40, '2025-10-28', '2025-11-02', 'Booked', 12500.00, 10.00, 0.00, 0.00, 'Card', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (18, NULL, 7, 66, '2025-10-26', '2025-10-29', 'Booked', 8500.00, 10.00, 0.00, 0.00, 'Online', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (19, NULL, 19, 74, '2025-10-29', '2025-11-03', 'Booked', 12500.00, 10.00, 500.00, 0.00, 'Card', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (20, NULL, 8, 98, '2025-10-27', '2025-10-30', 'Booked', 8500.00, 10.00, 0.00, 0.00, 'Cash', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'negombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (21, NULL, 22, 106, '2025-10-26', '2025-10-31', 'Booked', 12500.00, 10.00, 0.00, 0.00, 'Online', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'negombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (22, NULL, 9, 7, '2025-10-10', '2025-10-15', 'Checked-Out', 8500.00, 10.00, 0.00, 0.00, 'Card', 4250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (23, NULL, 10, 14, '2025-10-08', '2025-10-13', 'Checked-Out', 12500.00, 10.00, 1000.00, 0.00, 'Cash', 6250.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (24, NULL, 24, 22, '2025-10-05', '2025-10-10', 'Checked-Out', 35000.00, 10.00, 0.00, 0.00, 'Card', 17500.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (25, NULL, 25, 38, '2025-10-12', '2025-10-16', 'Checked-Out', 8500.00, 10.00, 0.00, 0.00, 'Online', 3400.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (26, NULL, 26, 45, '2025-10-07', '2025-10-11', 'Checked-Out', 12500.00, 10.00, 0.00, 0.00, 'Card', 5000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, 3);
INSERT INTO public.booking VALUES (27, NULL, 27, 52, '2025-10-09', '2025-10-14', 'Checked-Out', 22000.00, 10.00, 2000.00, 0.00, 'Online', 11000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, 3);
INSERT INTO public.booking VALUES (28, NULL, 28, 68, '2025-10-11', '2025-10-14', 'Checked-Out', 8500.00, 10.00, 0.00, 0.00, 'Cash', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (29, NULL, 29, 75, '2025-10-06', '2025-10-10', 'Checked-Out', 12500.00, 10.00, 0.00, 0.00, 'Card', 5000.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'kandy', NULL, false, NULL);
INSERT INTO public.booking VALUES (30, NULL, 6, 8, '2025-10-22', '2025-10-25', 'Cancelled', 8500.00, 10.00, 0.00, 0.00, 'Online', 2550.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'colombo', NULL, false, NULL);
INSERT INTO public.booking VALUES (31, NULL, 12, 41, '2025-10-24', '2025-10-27', 'Cancelled', 12500.00, 10.00, 0.00, 0.00, 'Card', 3750.00, DEFAULT, '2025-10-21 14:05:25.832823+05:30', 'galle', NULL, false, NULL);
INSERT INTO public.booking VALUES (32, NULL, 23, 1, '2025-11-05', '2025-11-08', 'Booked', 8500.00, 10.00, 850.00, 0.00, 'BankTransfer', 2550.00, DEFAULT, '2025-10-21 14:05:28.65193+05:30', 'colombo', 'Colombo Business Summit 2025', true, 1);
INSERT INTO public.booking VALUES (33, NULL, 24, 2, '2025-11-05', '2025-11-08', 'Booked', 8500.00, 10.00, 850.00, 0.00, 'BankTransfer', 2550.00, DEFAULT, '2025-10-21 14:05:28.65193+05:30', 'colombo', 'Colombo Business Summit 2025', true, 1);
INSERT INTO public.booking VALUES (34, NULL, 25, 4, '2025-11-05', '2025-11-08', 'Booked', 8500.00, 10.00, 850.00, 0.00, 'BankTransfer', 2550.00, DEFAULT, '2025-10-21 14:05:28.65193+05:30', 'colombo', 'Colombo Business Summit 2025', true, 1);


--
-- TOC entry 5476 (class 0 OID 27128)
-- Dependencies: 224
-- Data for Name: branch; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.branch VALUES (10, 'Colombo Branch', '+94112345678', 'No. 45, Galle Road, Colombo 03, Sri Lanka', 'Chaminda Jayasinghe', 'CMB');
INSERT INTO public.branch VALUES (11, 'Galle Branch', '+94912234567', 'No. 23, Fort, Galle, Sri Lanka', 'Kumari Perera', 'GAL');
INSERT INTO public.branch VALUES (12, 'Kandy Branch', '+94812223344', 'No. 67, Peradeniya Road, Kandy, Sri Lanka', 'Sunil Bandara', 'KAN');
INSERT INTO public.branch VALUES (13, 'Negombo Beach Branch', '+94312234455', 'No. 89, Beach Road, Negombo, Sri Lanka', 'Malini Fernando', 'NEG');


--
-- TOC entry 5505 (class 0 OID 28481)
-- Dependencies: 258
-- Data for Name: checkin_validation; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (1, 1, 1, 'NIC', '852341234V', 'validated', '2025-10-19 14:00:00+05:30', 5, 'ID verified successfully', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (2, 2, 11, 'Passport', 'GB123456789', 'validated', '2025-10-20 15:30:00+05:30', 5, 'Passport verified - British citizen', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (3, 3, 23, 'NIC', '862341567V', 'validated', '2025-10-18 16:00:00+05:30', 5, 'NIC verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (4, 4, 3, 'NIC', '882341234V', 'validated', '2025-10-20 13:00:00+05:30', 6, 'ID verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (5, 5, 13, 'Passport', 'DE456789123', 'validated', '2025-10-19 14:30:00+05:30', 6, 'German passport verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (6, 6, 18, 'Passport', 'US741852963', 'validated', '2025-10-21 12:00:00+05:30', 6, 'US passport verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (7, 7, 5, 'NIC', '872341234V', 'validated', '2025-10-20 11:00:00+05:30', 7, 'NIC verified successfully', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (8, 8, 12, 'Passport', 'AU987654321', 'validated', '2025-10-19 10:30:00+05:30', 7, 'Australian passport verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (9, 9, 21, 'NIC', '832341234V', 'validated', '2025-10-18 15:00:00+05:30', 7, 'ID verified - group booking', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (10, 10, 4, 'NIC', '923451234V', 'validated', '2025-10-20 12:30:00+05:30', 8, 'NIC verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (11, 11, 15, 'Passport', 'IN123789456', 'validated', '2025-10-19 13:00:00+05:30', 8, 'Indian passport verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (12, 12, 20, 'Passport', 'JP159753486', 'validated', '2025-10-18 14:00:00+05:30', 8, 'Japanese passport verified', '2025-10-21 14:15:43.818155+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (13, 14, 14, NULL, NULL, 'pending', NULL, NULL, 'Awaiting ID submission', '2025-10-21 14:15:54.505151+05:30');
INSERT INTO public.checkin_validation OVERRIDING SYSTEM VALUE VALUES (14, 15, 16, NULL, NULL, 'pending', NULL, NULL, 'Guest hasn''t arrived yet', '2025-10-21 14:15:54.505151+05:30');


--
-- TOC entry 5478 (class 0 OID 27134)
-- Dependencies: 226
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customer VALUES (1, NULL, 1, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (2, NULL, 2, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (3, NULL, 3, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (4, NULL, 4, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (5, NULL, 5, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (6, NULL, 6, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (7, NULL, 7, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (8, NULL, 8, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (9, NULL, 9, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (10, NULL, 10, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (11, NULL, 11, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (12, NULL, 12, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (13, NULL, 13, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (14, NULL, 14, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (15, NULL, 15, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (16, NULL, 16, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (17, NULL, 17, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (18, NULL, 18, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (19, NULL, 19, '2025-10-21 14:05:18.294567+05:30');
INSERT INTO public.customer VALUES (20, NULL, 20, '2025-10-21 14:05:18.294567+05:30');


--
-- TOC entry 5480 (class 0 OID 27139)
-- Dependencies: 228
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employee VALUES (1, 1, 10, 'Prasad Wijesinghe', 'prasad.w@skynest.lk', '+94112345011');
INSERT INTO public.employee VALUES (2, 2, 11, 'Nadeeka Silva', 'nadeeka.s@skynest.lk', '+94912345011');
INSERT INTO public.employee VALUES (3, 3, 12, 'Tharaka Gunasekara', 'tharaka.g@skynest.lk', '+94812345011');
INSERT INTO public.employee VALUES (4, 4, 13, 'Ruwan Perera', 'ruwan.p@skynest.lk', '+94312345011');
INSERT INTO public.employee VALUES (5, 5, 10, 'Nimal Dissanayake', 'nimal.d@skynest.lk', '+94112345012');
INSERT INTO public.employee VALUES (6, 6, 11, 'Buddhika Amarasinghe', 'buddhika.a@skynest.lk', '+94912345012');
INSERT INTO public.employee VALUES (7, 7, 12, 'Dilshan Wijeratne', 'dilshan.w@skynest.lk', '+94812345012');
INSERT INTO public.employee VALUES (8, 8, 13, 'Samantha Rodrigo', 'samantha.r@skynest.lk', '+94312345012');
INSERT INTO public.employee VALUES (9, 9, 10, 'Roshan Gunawardena', 'roshan.g@skynest.lk', '+94112345013');
INSERT INTO public.employee VALUES (10, 10, 11, 'Lasantha Mendis', 'lasantha.m@skynest.lk', '+94912345013');


--
-- TOC entry 5503 (class 0 OID 28453)
-- Dependencies: 256
-- Data for Name: group_booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.group_booking OVERRIDING SYSTEM VALUE VALUES (1, 'Colombo Business Summit 2025', 'Anil Jayawardena', '+94771234567', 'anil.j@cbsummit.lk', 'Conference group - require meeting room access', 15, '2025-10-21 14:05:20.428818+05:30', 1, 'colombo');
INSERT INTO public.group_booking OVERRIDING SYSTEM VALUE VALUES (2, 'Peradeniya University Alumni', 'Dr. Nimal Fernando', '+94712345678', 'nimal.f@pdn.ac.lk', 'Alumni reunion - need breakfast included', 12, '2025-10-21 14:05:20.428818+05:30', 3, 'kandy');
INSERT INTO public.group_booking OVERRIDING SYSTEM VALUE VALUES (3, 'Wedding Party - Silva Family', 'Ruwan Silva', '+94769876543', 'ruwan.silva@gmail.com', 'Wedding celebration - special decoration requested', 20, '2025-10-21 14:05:20.428818+05:30', 2, 'galle');
INSERT INTO public.group_booking OVERRIDING SYSTEM VALUE VALUES (4, 'Japanese Tour Group', 'Takeshi Yamamoto', '+819012345678', 'takeshi.y@jptours.jp', 'Group tour - vegetarian meals required', 25, '2025-10-21 14:05:20.428818+05:30', 4, 'negombo');


--
-- TOC entry 5482 (class 0 OID 27143)
-- Dependencies: 230
-- Data for Name: guest; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.guest VALUES (1, 'Nuwan Perera', 'nuwan.perera@gmail.com', '+94771234567', 'Male', '1985-03-15', 'No 45, Galle Road, Colombo 03', 'Sri Lankan', 'NIC', '852341234V');
INSERT INTO public.guest VALUES (2, 'Sanduni Fernando', 'sanduni.fernando@yahoo.com', '+94777654321', 'Female', '1990-07-22', 'No 23, Kandy Road, Peradeniya', 'Sri Lankan', 'NIC', '903451234V');
INSERT INTO public.guest VALUES (3, 'Kasun Silva', 'kasun.silva@outlook.com', '+94712345678', 'Male', '1988-11-30', 'No 67, Main Street, Galle', 'Sri Lankan', 'NIC', '882341234V');
INSERT INTO public.guest VALUES (4, 'Dilini Jayawardena', 'dilini.jay@gmail.com', '+94769876543', 'Female', '1992-05-18', 'No 12, Beach Road, Negombo', 'Sri Lankan', 'NIC', '923451234V');
INSERT INTO public.guest VALUES (5, 'Tharaka Rathnayake', 'tharaka.r@gmail.com', '+94723456789', 'Male', '1987-09-25', 'No 89, Temple Road, Kandy', 'Sri Lankan', 'NIC', '872341234V');
INSERT INTO public.guest VALUES (6, 'Chamari Wickramasinghe', 'chamari.w@yahoo.com', '+94778901234', 'Female', '1991-02-14', 'No 34, Lake View, Colombo 07', 'Sri Lankan', 'NIC', '913451234V');
INSERT INTO public.guest VALUES (7, 'Dinesh Kumara', 'dinesh.kumara@gmail.com', '+94714567890', 'Male', '1986-08-07', 'No 56, Hill Street, Nuwara Eliya', 'Sri Lankan', 'NIC', '862341234V');
INSERT INTO public.guest VALUES (8, 'Anusha De Silva', 'anusha.desilva@hotmail.com', '+94765432109', 'Female', '1989-12-03', 'No 78, Fort Road, Galle', 'Sri Lankan', 'NIC', '893451234V');
INSERT INTO public.guest VALUES (9, 'Ruwan Mendis', 'ruwan.mendis@gmail.com', '+94726789012', 'Male', '1984-06-20', 'No 23, Station Road, Kandy', 'Sri Lankan', 'NIC', '842341234V');
INSERT INTO public.guest VALUES (10, 'Nadeeka Wijesinghe', 'nadeeka.w@gmail.com', '+94773210987', 'Female', '1993-04-11', 'No 45, Sea View, Negombo', 'Sri Lankan', 'NIC', '933451234V');
INSERT INTO public.guest VALUES (11, 'James Anderson', 'james.anderson@gmail.com', '+447912345678', 'Male', '1982-01-15', 'London, United Kingdom', 'British', 'Passport', 'GB123456789');
INSERT INTO public.guest VALUES (12, 'Sarah Mitchell', 'sarah.mitchell@yahoo.com', '+61412345678', 'Female', '1990-03-28', 'Sydney, Australia', 'Australian', 'Passport', 'AU987654321');
INSERT INTO public.guest VALUES (13, 'Hans Mueller', 'hans.mueller@gmail.com', '+4915123456789', 'Male', '1975-11-05', 'Berlin, Germany', 'German', 'Passport', 'DE456789123');
INSERT INTO public.guest VALUES (14, 'Maria Garcia', 'maria.garcia@hotmail.com', '+34612345678', 'Female', '1988-07-19', 'Madrid, Spain', 'Spanish', 'Passport', 'ES741258963');
INSERT INTO public.guest VALUES (15, 'Raj Patel', 'raj.patel@gmail.com', '+919876543210', 'Male', '1985-09-12', 'Mumbai, India', 'Indian', 'Passport', 'IN123789456');
INSERT INTO public.guest VALUES (16, 'Sophie Dubois', 'sophie.dubois@gmail.com', '+33612345678', 'Female', '1992-05-24', 'Paris, France', 'French', 'Passport', 'FR852963147');
INSERT INTO public.guest VALUES (17, 'David Kim', 'david.kim@gmail.com', '+821012345678', 'Male', '1987-08-30', 'Seoul, South Korea', 'South Korean', 'Passport', 'KR369258147');
INSERT INTO public.guest VALUES (18, 'Emma Johnson', 'emma.johnson@gmail.com', '+12125551234', 'Female', '1991-12-15', 'New York, USA', 'American', 'Passport', 'US741852963');
INSERT INTO public.guest VALUES (19, 'Mohammed Al-Rashid', 'mohammed.ar@gmail.com', '+971501234567', 'Male', '1983-04-08', 'Dubai, UAE', 'Emirati', 'Passport', 'AE963852741');
INSERT INTO public.guest VALUES (20, 'Yuki Tanaka', 'yuki.tanaka@gmail.com', '+819012345678', 'Female', '1989-10-22', 'Tokyo, Japan', 'Japanese', 'Passport', 'JP159753486');
INSERT INTO public.guest VALUES (21, 'Lakshan Bandara', 'lakshan.b@gmail.com', '+94718765432', 'Male', '1986-02-28', 'No 67, Queen Street, Kandy', 'Sri Lankan', 'NIC', '862341567V');
INSERT INTO public.guest VALUES (22, 'Thisara Ekanayake', 'thisara.ek@yahoo.com', '+94767890123', 'Female', '1994-06-05', 'No 90, Main Road, Matara', 'Sri Lankan', 'NIC', '943451234V');
INSERT INTO public.guest VALUES (23, 'Buddhika Gunasekara', 'buddhika.g@gmail.com', '+94729012345', 'Male', '1983-10-17', 'No 12, Park Road, Colombo 05', 'Sri Lankan', 'NIC', '832341234V');
INSERT INTO public.guest VALUES (24, 'Priyanka Herath', 'priyanka.h@gmail.com', '+94776543210', 'Female', '1991-08-29', 'No 34, Beach Road, Hikkaduwa', 'Sri Lankan', 'NIC', '913451678V');
INSERT INTO public.guest VALUES (25, 'Sameera Jayasuriya', 'sameera.j@gmail.com', '+94713456789', 'Male', '1987-12-11', 'No 56, Hill Road, Badulla', 'Sri Lankan', 'NIC', '872341890V');
INSERT INTO public.guest VALUES (26, 'Robert Chen', 'robert.chen@techcorp.com', '+8613912345678', 'Male', '1980-05-14', 'Shanghai, China', 'Chinese', 'Passport', 'CN789456123');
INSERT INTO public.guest VALUES (27, 'Lisa Brown', 'lisa.brown@globalinc.com', '+442012345678', 'Female', '1986-09-03', 'Manchester, UK', 'British', 'Passport', 'GB987654321');
INSERT INTO public.guest VALUES (28, 'Marco Rossi', 'marco.rossi@italytech.it', '+393312345678', 'Male', '1984-03-20', 'Milan, Italy', 'Italian', 'Passport', 'IT456123789');
INSERT INTO public.guest VALUES (29, 'Anna Kowalski', 'anna.kowalski@polcorp.pl', '+48501234567', 'Female', '1990-11-08', 'Warsaw, Poland', 'Polish', 'Passport', 'PL147258369');
INSERT INTO public.guest VALUES (30, 'Carlos Santos', 'carlos.santos@brazilco.br', '+5511987654321', 'Male', '1982-07-25', 'São Paulo, Brazil', 'Brazilian', 'Passport', 'BR369147258');


--
-- TOC entry 5507 (class 0 OID 28514)
-- Dependencies: 260
-- Data for Name: id_validation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5484 (class 0 OID 27149)
-- Dependencies: 232
-- Data for Name: invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.invoice VALUES (1, 22, '2025-10-06', '2025-10-10', '2025-10-10 14:00:00+05:30');
INSERT INTO public.invoice VALUES (2, 23, '2025-10-11', '2025-10-14', '2025-10-14 10:00:00+05:30');
INSERT INTO public.invoice VALUES (3, 24, '2025-10-10', '2025-10-15', '2025-10-15 15:00:00+05:30');
INSERT INTO public.invoice VALUES (4, 25, '2025-10-08', '2025-10-13', '2025-10-13 12:00:00+05:30');
INSERT INTO public.invoice VALUES (5, 26, '2025-10-05', '2025-10-10', '2025-10-10 17:00:00+05:30');
INSERT INTO public.invoice VALUES (6, 27, '2025-10-12', '2025-10-16', '2025-10-16 11:00:00+05:30');
INSERT INTO public.invoice VALUES (7, 28, '2025-10-07', '2025-10-11', '2025-10-11 16:00:00+05:30');
INSERT INTO public.invoice VALUES (8, 29, '2025-10-09', '2025-10-14', '2025-10-14 13:00:00+05:30');


--
-- TOC entry 5486 (class 0 OID 27154)
-- Dependencies: 234
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payment VALUES (1, 22, 55000.00, 'Card', '2025-10-10 13:45:00+05:30', 'PAY-008-2025');
INSERT INTO public.payment VALUES (2, 23, 14025.00, 'Cash', '2025-10-14 09:30:00+05:30', 'PAY-007-2025');
INSERT INTO public.payment VALUES (3, 24, 42500.00, 'Card', '2025-10-15 14:30:00+05:30', 'PAY-001-2025');
INSERT INTO public.payment VALUES (4, 25, 55750.00, 'Cash', '2025-10-13 11:20:00+05:30', 'PAY-002-2025');
INSERT INTO public.payment VALUES (5, 26, 192500.00, 'Card', '2025-10-10 16:45:00+05:30', 'PAY-003-2025');
INSERT INTO public.payment VALUES (6, 27, 18700.00, 'Online', '2025-10-16 10:15:00+05:30', 'PAY-004-2025');
INSERT INTO public.payment VALUES (7, 28, 52250.00, 'Card', '2025-10-11 15:30:00+05:30', 'PAY-005-2025');
INSERT INTO public.payment VALUES (8, 29, 98000.00, 'Online', '2025-10-14 12:00:00+05:30', 'PAY-006-2025');
INSERT INTO public.payment VALUES (9, 1, 20000.00, 'Card', '2025-10-20 10:00:00+05:30', 'PAY-009-2025');
INSERT INTO public.payment VALUES (10, 2, 30000.00, 'Online', '2025-10-21 11:30:00+05:30', 'PAY-010-2025');
INSERT INTO public.payment VALUES (11, 3, 40000.00, 'Card', '2025-10-19 14:20:00+05:30', 'PAY-011-2025');
INSERT INTO public.payment VALUES (12, 4, 15000.00, 'Cash', '2025-10-20 09:15:00+05:30', 'PAY-012-2025');
INSERT INTO public.payment VALUES (13, 5, 25000.00, 'Card', '2025-10-20 16:45:00+05:30', 'PAY-013-2025');
INSERT INTO public.payment VALUES (14, 6, 35000.00, 'Online', '2025-10-21 10:30:00+05:30', 'PAY-014-2025');
INSERT INTO public.payment VALUES (15, 7, 18000.00, 'Cash', '2025-10-20 15:00:00+05:30', 'PAY-015-2025');
INSERT INTO public.payment VALUES (16, 8, 22000.00, 'Card', '2025-10-19 12:30:00+05:30', 'PAY-016-2025');
INSERT INTO public.payment VALUES (17, 9, 60000.00, 'Online', '2025-10-19 11:00:00+05:30', 'PAY-017-2025');
INSERT INTO public.payment VALUES (18, 10, 14000.00, 'Card', '2025-10-20 13:20:00+05:30', 'PAY-018-2025');
INSERT INTO public.payment VALUES (19, 11, 28000.00, 'Online', '2025-10-20 14:45:00+05:30', 'PAY-019-2025');
INSERT INTO public.payment VALUES (20, 12, 70000.00, 'Card', '2025-10-19 10:15:00+05:30', 'PAY-020-2025');


--
-- TOC entry 5487 (class 0 OID 27158)
-- Dependencies: 235
-- Data for Name: payment_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payment_adjustment VALUES (1, 30, 2550.00, 'refund', 'Full advance refund - cancelled 5 days before check-in', '2025-10-17 10:30:00+05:30');
INSERT INTO public.payment_adjustment VALUES (2, 31, 3375.00, 'refund', 'Refund after 10% late-cancel fee', '2025-10-19 14:20:00+05:30');


--
-- TOC entry 5490 (class 0 OID 27165)
-- Dependencies: 238
-- Data for Name: pre_booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pre_booking VALUES (1, 1, 2, 'Online', '2025-11-15', '2025-11-18', NULL, 5, '2025-10-21 14:05:22.196718+05:30', 1, 1, NULL, NULL, NULL, NULL, false, NULL, 1, 'Pending', 'Late check-in expected', '2025-11-08', 10);
INSERT INTO public.pre_booking VALUES (2, 2, 2, 'Phone', '2025-11-20', '2025-11-23', NULL, 7, '2025-10-21 14:05:22.196718+05:30', 2, 2, NULL, NULL, NULL, NULL, false, NULL, 1, 'Pending', 'Need ground floor room', '2025-11-13', 12);
INSERT INTO public.pre_booking VALUES (3, 3, 4, 'Walk-in', '2025-12-01', '2025-12-05', NULL, 6, '2025-10-21 14:05:22.196718+05:30', 3, 4, NULL, NULL, NULL, NULL, false, NULL, 1, 'Pending', 'Family with kids', '2025-11-24', 11);
INSERT INTO public.pre_booking VALUES (4, 4, 3, 'Online', '2025-11-10', '2025-11-15', NULL, 5, '2025-10-21 14:05:22.196718+05:30', 4, 3, NULL, NULL, NULL, NULL, false, NULL, 1, 'Confirmed', 'Business traveler', '2025-11-03', 10);
INSERT INTO public.pre_booking VALUES (5, 5, 2, 'Phone', '2025-12-10', '2025-12-14', NULL, 8, '2025-10-21 14:05:22.196718+05:30', 5, 8, NULL, NULL, NULL, NULL, false, NULL, 1, 'Confirmed', 'Honeymoon couple', '2025-12-03', 13);
INSERT INTO public.pre_booking VALUES (6, 6, 2, 'Online', '2025-10-15', '2025-10-18', NULL, 5, '2025-10-21 14:05:22.196718+05:30', 6, 2, NULL, NULL, NULL, NULL, false, NULL, 1, 'Cancelled', 'Changed travel plans', '2025-10-08', 10);
INSERT INTO public.pre_booking VALUES (7, 7, 2, 'Phone', '2025-11-25', '2025-11-28', NULL, 6, '2025-10-21 14:05:22.196718+05:30', 7, 1, NULL, NULL, NULL, NULL, true, NULL, 10, 'Confirmed', 'Part of wedding group', '2025-11-18', 11);


--
-- TOC entry 5492 (class 0 OID 27170)
-- Dependencies: 240
-- Data for Name: room; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.room VALUES (1, 10, 1, 'CMB001', 'Available');
INSERT INTO public.room VALUES (2, 10, 1, 'CMB002', 'Available');
INSERT INTO public.room VALUES (3, 10, 1, 'CMB003', 'Occupied');
INSERT INTO public.room VALUES (4, 10, 1, 'CMB004', 'Available');
INSERT INTO public.room VALUES (5, 10, 1, 'CMB005', 'Available');
INSERT INTO public.room VALUES (6, 10, 1, 'CMB006', 'Available');
INSERT INTO public.room VALUES (7, 10, 1, 'CMB007', 'Occupied');
INSERT INTO public.room VALUES (8, 10, 1, 'CMB008', 'Available');
INSERT INTO public.room VALUES (9, 10, 2, 'CMB009', 'Available');
INSERT INTO public.room VALUES (10, 10, 2, 'CMB010', 'Available');
INSERT INTO public.room VALUES (11, 10, 2, 'CMB011', 'Occupied');
INSERT INTO public.room VALUES (12, 10, 2, 'CMB012', 'Available');
INSERT INTO public.room VALUES (13, 10, 2, 'CMB013', 'Available');
INSERT INTO public.room VALUES (14, 10, 2, 'CMB014', 'Maintenance');
INSERT INTO public.room VALUES (15, 10, 3, 'CMB015', 'Available');
INSERT INTO public.room VALUES (16, 10, 3, 'CMB016', 'Available');
INSERT INTO public.room VALUES (17, 10, 3, 'CMB017', 'Occupied');
INSERT INTO public.room VALUES (18, 10, 3, 'CMB018', 'Available');
INSERT INTO public.room VALUES (19, 10, 4, 'CMB019', 'Available');
INSERT INTO public.room VALUES (20, 10, 4, 'CMB020', 'Available');
INSERT INTO public.room VALUES (21, 10, 4, 'CMB021', 'Available');
INSERT INTO public.room VALUES (22, 10, 5, 'CMB022', 'Available');
INSERT INTO public.room VALUES (23, 10, 5, 'CMB023', 'Occupied');
INSERT INTO public.room VALUES (24, 10, 6, 'CMB024', 'Available');
INSERT INTO public.room VALUES (25, 10, 6, 'CMB025', 'Available');
INSERT INTO public.room VALUES (26, 10, 6, 'CMB026', 'Available');
INSERT INTO public.room VALUES (27, 10, 7, 'CMB027', 'Available');
INSERT INTO public.room VALUES (28, 10, 7, 'CMB028', 'Available');
INSERT INTO public.room VALUES (29, 10, 7, 'CMB029', 'Available');
INSERT INTO public.room VALUES (30, 10, 8, 'CMB030', 'Available');
INSERT INTO public.room VALUES (31, 11, 1, 'GAL001', 'Available');
INSERT INTO public.room VALUES (32, 11, 1, 'GAL002', 'Available');
INSERT INTO public.room VALUES (33, 11, 1, 'GAL003', 'Available');
INSERT INTO public.room VALUES (34, 11, 1, 'GAL004', 'Occupied');
INSERT INTO public.room VALUES (35, 11, 1, 'GAL005', 'Available');
INSERT INTO public.room VALUES (36, 11, 1, 'GAL006', 'Available');
INSERT INTO public.room VALUES (37, 11, 1, 'GAL007', 'Available');
INSERT INTO public.room VALUES (38, 11, 1, 'GAL008', 'Available');
INSERT INTO public.room VALUES (39, 11, 2, 'GAL009', 'Available');
INSERT INTO public.room VALUES (40, 11, 2, 'GAL010', 'Occupied');
INSERT INTO public.room VALUES (41, 11, 2, 'GAL011', 'Available');
INSERT INTO public.room VALUES (42, 11, 2, 'GAL012', 'Available');
INSERT INTO public.room VALUES (43, 11, 2, 'GAL013', 'Available');
INSERT INTO public.room VALUES (44, 11, 2, 'GAL014', 'Available');
INSERT INTO public.room VALUES (45, 11, 3, 'GAL015', 'Available');
INSERT INTO public.room VALUES (46, 11, 3, 'GAL016', 'Available');
INSERT INTO public.room VALUES (47, 11, 3, 'GAL017', 'Available');
INSERT INTO public.room VALUES (48, 11, 3, 'GAL018', 'Occupied');
INSERT INTO public.room VALUES (49, 11, 4, 'GAL019', 'Available');
INSERT INTO public.room VALUES (50, 11, 4, 'GAL020', 'Available');
INSERT INTO public.room VALUES (51, 11, 4, 'GAL021', 'Available');
INSERT INTO public.room VALUES (52, 11, 5, 'GAL022', 'Available');
INSERT INTO public.room VALUES (53, 11, 5, 'GAL023', 'Available');
INSERT INTO public.room VALUES (54, 11, 6, 'GAL024', 'Available');
INSERT INTO public.room VALUES (55, 11, 6, 'GAL025', 'Available');
INSERT INTO public.room VALUES (56, 11, 6, 'GAL026', 'Available');
INSERT INTO public.room VALUES (57, 11, 7, 'GAL027', 'Available');
INSERT INTO public.room VALUES (58, 11, 7, 'GAL028', 'Available');
INSERT INTO public.room VALUES (59, 11, 7, 'GAL029', 'Occupied');
INSERT INTO public.room VALUES (60, 11, 8, 'GAL030', 'Available');
INSERT INTO public.room VALUES (61, 12, 1, 'KAN001', 'Available');
INSERT INTO public.room VALUES (62, 12, 1, 'KAN002', 'Available');
INSERT INTO public.room VALUES (63, 12, 1, 'KAN003', 'Available');
INSERT INTO public.room VALUES (64, 12, 1, 'KAN004', 'Available');
INSERT INTO public.room VALUES (65, 12, 1, 'KAN005', 'Occupied');
INSERT INTO public.room VALUES (66, 12, 1, 'KAN006', 'Available');
INSERT INTO public.room VALUES (67, 12, 1, 'KAN007', 'Available');
INSERT INTO public.room VALUES (68, 12, 1, 'KAN008', 'Maintenance');
INSERT INTO public.room VALUES (69, 12, 2, 'KAN009', 'Available');
INSERT INTO public.room VALUES (70, 12, 2, 'KAN010', 'Available');
INSERT INTO public.room VALUES (71, 12, 2, 'KAN011', 'Available');
INSERT INTO public.room VALUES (72, 12, 2, 'KAN012', 'Occupied');
INSERT INTO public.room VALUES (73, 12, 2, 'KAN013', 'Available');
INSERT INTO public.room VALUES (74, 12, 2, 'KAN014', 'Available');
INSERT INTO public.room VALUES (75, 12, 3, 'KAN015', 'Available');
INSERT INTO public.room VALUES (76, 12, 3, 'KAN016', 'Available');
INSERT INTO public.room VALUES (77, 12, 3, 'KAN017', 'Available');
INSERT INTO public.room VALUES (78, 12, 3, 'KAN018', 'Available');
INSERT INTO public.room VALUES (79, 12, 4, 'KAN019', 'Occupied');
INSERT INTO public.room VALUES (80, 12, 4, 'KAN020', 'Available');
INSERT INTO public.room VALUES (81, 12, 4, 'KAN021', 'Available');
INSERT INTO public.room VALUES (82, 12, 5, 'KAN022', 'Available');
INSERT INTO public.room VALUES (83, 12, 5, 'KAN023', 'Available');
INSERT INTO public.room VALUES (84, 12, 6, 'KAN024', 'Available');
INSERT INTO public.room VALUES (85, 12, 6, 'KAN025', 'Available');
INSERT INTO public.room VALUES (86, 12, 6, 'KAN026', 'Available');
INSERT INTO public.room VALUES (87, 12, 7, 'KAN027', 'Available');
INSERT INTO public.room VALUES (88, 12, 7, 'KAN028', 'Available');
INSERT INTO public.room VALUES (89, 12, 7, 'KAN029', 'Available');
INSERT INTO public.room VALUES (90, 12, 8, 'KAN030', 'Available');
INSERT INTO public.room VALUES (91, 13, 1, 'NEG001', 'Available');
INSERT INTO public.room VALUES (92, 13, 1, 'NEG002', 'Available');
INSERT INTO public.room VALUES (93, 13, 1, 'NEG003', 'Available');
INSERT INTO public.room VALUES (94, 13, 1, 'NEG004', 'Available');
INSERT INTO public.room VALUES (95, 13, 1, 'NEG005', 'Available');
INSERT INTO public.room VALUES (96, 13, 1, 'NEG006', 'Occupied');
INSERT INTO public.room VALUES (97, 13, 1, 'NEG007', 'Available');
INSERT INTO public.room VALUES (98, 13, 1, 'NEG008', 'Available');
INSERT INTO public.room VALUES (99, 13, 2, 'NEG009', 'Available');
INSERT INTO public.room VALUES (100, 13, 2, 'NEG010', 'Available');
INSERT INTO public.room VALUES (101, 13, 2, 'NEG011', 'Available');
INSERT INTO public.room VALUES (102, 13, 2, 'NEG012', 'Available');
INSERT INTO public.room VALUES (103, 13, 2, 'NEG013', 'Occupied');
INSERT INTO public.room VALUES (104, 13, 2, 'NEG014', 'Available');
INSERT INTO public.room VALUES (105, 13, 3, 'NEG015', 'Available');
INSERT INTO public.room VALUES (106, 13, 3, 'NEG016', 'Available');
INSERT INTO public.room VALUES (107, 13, 3, 'NEG017', 'Available');
INSERT INTO public.room VALUES (108, 13, 3, 'NEG018', 'Available');
INSERT INTO public.room VALUES (109, 13, 4, 'NEG019', 'Available');
INSERT INTO public.room VALUES (110, 13, 4, 'NEG020', 'Available');
INSERT INTO public.room VALUES (111, 13, 4, 'NEG021', 'Available');
INSERT INTO public.room VALUES (112, 13, 5, 'NEG022', 'Available');
INSERT INTO public.room VALUES (113, 13, 5, 'NEG023', 'Available');
INSERT INTO public.room VALUES (114, 13, 6, 'NEG024', 'Available');
INSERT INTO public.room VALUES (115, 13, 6, 'NEG025', 'Available');
INSERT INTO public.room VALUES (116, 13, 6, 'NEG026', 'Available');
INSERT INTO public.room VALUES (117, 13, 7, 'NEG027', 'Available');
INSERT INTO public.room VALUES (118, 13, 7, 'NEG028', 'Available');
INSERT INTO public.room VALUES (119, 13, 7, 'NEG029', 'Available');
INSERT INTO public.room VALUES (120, 13, 8, 'NEG030', 'Occupied');


--
-- TOC entry 5494 (class 0 OID 27175)
-- Dependencies: 242
-- Data for Name: room_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.room_type VALUES (1, 'Standard Room', 2, 8500.00, 'AC, TV, WiFi, Mini Fridge');
INSERT INTO public.room_type VALUES (2, 'Deluxe Room', 2, 12500.00, 'AC, Smart TV, WiFi, Mini Bar, Balcony');
INSERT INTO public.room_type VALUES (3, 'Executive Suite', 3, 18500.00, 'AC, Smart TV, WiFi, Mini Bar, Living Area, Ocean View');
INSERT INTO public.room_type VALUES (4, 'Family Suite', 4, 22000.00, 'AC, 2 Bedrooms, Smart TV, WiFi, Kitchenette, Living Area');
INSERT INTO public.room_type VALUES (5, 'Presidential Suite', 4, 35000.00, 'AC, 2 Bedrooms, Premium TV, WiFi, Full Kitchen, Living Area, Dining Area, Ocean View, Private Balcony');
INSERT INTO public.room_type VALUES (6, 'Budget Room', 1, 5500.00, 'Fan, WiFi, Shared Bathroom');
INSERT INTO public.room_type VALUES (7, 'Twin Room', 2, 9500.00, 'AC, TV, WiFi, 2 Single Beds');
INSERT INTO public.room_type VALUES (8, 'Honeymoon Suite', 2, 25000.00, 'AC, King Bed, Jacuzzi, Smart TV, WiFi, Romantic Decor, Ocean View');


--
-- TOC entry 5496 (class 0 OID 27181)
-- Dependencies: 244
-- Data for Name: service_catalog; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.service_catalog VALUES (1, 'BRKFST', 'Breakfast Buffet', 'Food & Beverage', 1500.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (2, 'LUNCH', 'Lunch Buffet', 'Food & Beverage', 2000.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (3, 'DINNER', 'Dinner Buffet', 'Food & Beverage', 2500.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (4, 'RMSERV', 'Room Service', 'Food & Beverage', 800.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (5, 'KTLRICE', 'Kottu with Rice', 'Food & Beverage', 950.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (6, 'SEAFOOD', 'Seafood Platter', 'Food & Beverage', 3500.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (7, 'HOPPERS', 'String Hoppers Set', 'Food & Beverage', 450.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (8, 'CURDCOF', 'Coffee with Curd', 'Food & Beverage', 350.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (9, 'AYURV', 'Ayurvedic Massage', 'Spa & Wellness', 4500.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (10, 'FACIAL', 'Facial Treatment', 'Spa & Wellness', 3000.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (11, 'BODYWRP', 'Body Wrap', 'Spa & Wellness', 5000.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (12, 'PEDICUR', 'Pedicure', 'Spa & Wellness', 2000.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (13, 'MANICUR', 'Manicure', 'Spa & Wellness', 1500.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (14, 'AIRPORT', 'Airport Pickup', 'Transport', 3500.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (15, 'AIRDRP', 'Airport Drop', 'Transport', 3500.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (16, 'CARRENT', 'Car Rental (Daily)', 'Transport', 8500.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (17, 'TUKRENT', 'Tuk Tuk Hire (Hourly)', 'Transport', 1200.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (18, 'CITYTOUR', 'City Tour', 'Activities', 5000.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (19, 'DIVING', 'Scuba Diving', 'Activities', 8500.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (20, 'SNORKEL', 'Snorkeling', 'Activities', 3500.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (21, 'SURF', 'Surfing Lesson', 'Activities', 4500.00, 15.00, true);
INSERT INTO public.service_catalog VALUES (22, 'TEMPLE', 'Temple Visit Tour', 'Activities', 4000.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (23, 'TEAPLNT', 'Tea Plantation Tour', 'Activities', 6000.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (24, 'LAUNDRY', 'Laundry Service (per kg)', 'Laundry', 500.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (25, 'IRONING', 'Ironing Service', 'Laundry', 200.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (26, 'DRYCLN', 'Dry Cleaning', 'Laundry', 800.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (27, 'MINIBAR', 'Mini Bar Items', 'Others', 1200.00, 10.00, true);
INSERT INTO public.service_catalog VALUES (28, 'WIFI', 'Premium WiFi (Daily)', 'Others', 500.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (29, 'PARKING', 'Parking (Daily)', 'Others', 300.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (30, 'PETSIT', 'Pet Sitting', 'Others', 2000.00, 0.00, true);
INSERT INTO public.service_catalog VALUES (31, 'BABYSIT', 'Babysitting Service', 'Others', 1500.00, 0.00, true);


--
-- TOC entry 5498 (class 0 OID 27187)
-- Dependencies: 246
-- Data for Name: service_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.service_usage VALUES (1, 1, 9, '2025-10-20', 1, 4500.00);
INSERT INTO public.service_usage VALUES (2, 1, 2, '2025-10-20', 2, 2000.00);
INSERT INTO public.service_usage VALUES (3, 1, 1, '2025-10-20', 2, 1500.00);
INSERT INTO public.service_usage VALUES (4, 2, 14, '2025-10-21', 1, 3500.00);
INSERT INTO public.service_usage VALUES (5, 2, 24, '2025-10-21', 3, 500.00);
INSERT INTO public.service_usage VALUES (6, 2, 3, '2025-10-21', 2, 2500.00);
INSERT INTO public.service_usage VALUES (7, 2, 1, '2025-10-21', 2, 1500.00);
INSERT INTO public.service_usage VALUES (8, 3, 27, '2025-10-19', 5, 1200.00);
INSERT INTO public.service_usage VALUES (9, 3, 18, '2025-10-20', 1, 5000.00);
INSERT INTO public.service_usage VALUES (10, 3, 1, '2025-10-21', 2, 1500.00);
INSERT INTO public.service_usage VALUES (11, 3, 1, '2025-10-20', 2, 1500.00);
INSERT INTO public.service_usage VALUES (12, 3, 1, '2025-10-19', 2, 1500.00);
INSERT INTO public.service_usage VALUES (13, 4, 5, '2025-10-21', 2, 950.00);
INSERT INTO public.service_usage VALUES (14, 4, 4, '2025-10-20', 1, 800.00);
INSERT INTO public.service_usage VALUES (15, 4, 1, '2025-10-21', 2, 1500.00);
INSERT INTO public.service_usage VALUES (16, 5, 10, '2025-10-21', 2, 3000.00);
INSERT INTO public.service_usage VALUES (17, 5, 9, '2025-10-20', 2, 4500.00);
INSERT INTO public.service_usage VALUES (18, 5, 3, '2025-10-20', 2, 2500.00);
INSERT INTO public.service_usage VALUES (19, 5, 1, '2025-10-20', 2, 1500.00);
INSERT INTO public.service_usage VALUES (20, 6, 23, '2025-10-21', 1, 6000.00);
INSERT INTO public.service_usage VALUES (21, 6, 14, '2025-10-21', 1, 3500.00);
INSERT INTO public.service_usage VALUES (22, 6, 2, '2025-10-21', 2, 2000.00);
INSERT INTO public.service_usage VALUES (23, 6, 1, '2025-10-21', 2, 1500.00);
INSERT INTO public.service_usage VALUES (24, 24, 18, '2025-10-12', 1, 5000.00);
INSERT INTO public.service_usage VALUES (25, 24, 3, '2025-10-11', 5, 2500.00);
INSERT INTO public.service_usage VALUES (26, 24, 1, '2025-10-11', 10, 1500.00);
INSERT INTO public.service_usage VALUES (27, 25, 15, '2025-10-13', 1, 3500.00);
INSERT INTO public.service_usage VALUES (28, 25, 14, '2025-10-08', 1, 3500.00);
INSERT INTO public.service_usage VALUES (29, 25, 9, '2025-10-10', 2, 4500.00);
INSERT INTO public.service_usage VALUES (30, 25, 2, '2025-10-09', 5, 2000.00);
INSERT INTO public.service_usage VALUES (31, 25, 1, '2025-10-09', 10, 1500.00);
INSERT INTO public.service_usage VALUES (32, 26, 19, '2025-10-07', 2, 8500.00);
INSERT INTO public.service_usage VALUES (33, 26, 16, '2025-10-06', 5, 8500.00);
INSERT INTO public.service_usage VALUES (34, 26, 9, '2025-10-08', 2, 4500.00);
INSERT INTO public.service_usage VALUES (35, 26, 6, '2025-10-07', 2, 3500.00);
INSERT INTO public.service_usage VALUES (36, 26, 3, '2025-10-06', 10, 2500.00);
INSERT INTO public.service_usage VALUES (37, 26, 1, '2025-10-06', 10, 1500.00);
INSERT INTO public.service_usage VALUES (38, 27, 7, '2025-10-14', 4, 450.00);
INSERT INTO public.service_usage VALUES (39, 27, 5, '2025-10-13', 4, 950.00);
INSERT INTO public.service_usage VALUES (40, 27, 1, '2025-10-13', 8, 1500.00);
INSERT INTO public.service_usage VALUES (41, 28, 27, '2025-10-08', 3, 1200.00);
INSERT INTO public.service_usage VALUES (42, 28, 18, '2025-10-09', 1, 5000.00);
INSERT INTO public.service_usage VALUES (43, 28, 9, '2025-10-09', 2, 4500.00);
INSERT INTO public.service_usage VALUES (44, 28, 3, '2025-10-08', 4, 2500.00);
INSERT INTO public.service_usage VALUES (45, 28, 2, '2025-10-08', 4, 2000.00);
INSERT INTO public.service_usage VALUES (46, 28, 1, '2025-10-08', 8, 1500.00);


--
-- TOC entry 5500 (class 0 OID 27192)
-- Dependencies: 248
-- Data for Name: user_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_account VALUES (1, 'manager_col', '$2a$10$dummyhashformanager1', 'Manager', NULL);
INSERT INTO public.user_account VALUES (2, 'manager_gal', '$2a$10$dummyhashformanager2', 'Manager', NULL);
INSERT INTO public.user_account VALUES (3, 'manager_kan', '$2a$10$dummyhashformanager3', 'Manager', NULL);
INSERT INTO public.user_account VALUES (4, 'manager_neg', '$2a$10$dummyhashformanager4', 'Manager', NULL);
INSERT INTO public.user_account VALUES (5, 'receptionist1', '$2a$10$dummyhashforreceptionist1', 'Receptionist', NULL);
INSERT INTO public.user_account VALUES (6, 'receptionist2', '$2a$10$dummyhashforreceptionist2', 'Receptionist', NULL);
INSERT INTO public.user_account VALUES (7, 'receptionist3', '$2a$10$dummyhashforreceptionist3', 'Receptionist', NULL);
INSERT INTO public.user_account VALUES (8, 'receptionist4', '$2a$10$dummyhashforreceptionist4', 'Receptionist', NULL);
INSERT INTO public.user_account VALUES (9, 'accountant1', '$2a$10$dummyhashforaccountant1', 'Accountant', NULL);
INSERT INTO public.user_account VALUES (10, 'accountant2', '$2a$10$dummyhashforaccountant2', 'Accountant', NULL);


--
-- TOC entry 5560 (class 0 OID 0)
-- Dependencies: 221
-- Name: audit_log_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_audit_id_seq', 1, false);


--
-- TOC entry 5561 (class 0 OID 0)
-- Dependencies: 223
-- Name: booking_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.booking_booking_id_seq', 34, true);


--
-- TOC entry 5562 (class 0 OID 0)
-- Dependencies: 225
-- Name: branch_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_branch_id_seq', 1, false);


--
-- TOC entry 5563 (class 0 OID 0)
-- Dependencies: 257
-- Name: checkin_validation_validation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.checkin_validation_validation_id_seq', 14, true);


--
-- TOC entry 5564 (class 0 OID 0)
-- Dependencies: 227
-- Name: customer_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_customer_id_seq', 20, true);


--
-- TOC entry 5565 (class 0 OID 0)
-- Dependencies: 229
-- Name: employee_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_employee_id_seq', 10, true);


--
-- TOC entry 5566 (class 0 OID 0)
-- Dependencies: 255
-- Name: group_booking_group_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_booking_group_booking_id_seq', 4, true);


--
-- TOC entry 5567 (class 0 OID 0)
-- Dependencies: 231
-- Name: guest_guest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_guest_id_seq', 30, true);


--
-- TOC entry 5568 (class 0 OID 0)
-- Dependencies: 259
-- Name: id_validation_rules_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.id_validation_rules_rule_id_seq', 1, false);


--
-- TOC entry 5569 (class 0 OID 0)
-- Dependencies: 233
-- Name: invoice_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_invoice_id_seq', 8, true);


--
-- TOC entry 5570 (class 0 OID 0)
-- Dependencies: 236
-- Name: payment_adjustment_adjustment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_adjustment_adjustment_id_seq', 2, true);


--
-- TOC entry 5571 (class 0 OID 0)
-- Dependencies: 237
-- Name: payment_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_payment_id_seq', 20, true);


--
-- TOC entry 5572 (class 0 OID 0)
-- Dependencies: 239
-- Name: pre_booking_pre_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pre_booking_pre_booking_id_seq', 7, true);


--
-- TOC entry 5573 (class 0 OID 0)
-- Dependencies: 241
-- Name: room_room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_room_id_seq', 120, true);


--
-- TOC entry 5574 (class 0 OID 0)
-- Dependencies: 243
-- Name: room_type_room_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_type_room_type_id_seq', 1, false);


--
-- TOC entry 5575 (class 0 OID 0)
-- Dependencies: 245
-- Name: service_catalog_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_catalog_service_id_seq', 31, true);


--
-- TOC entry 5576 (class 0 OID 0)
-- Dependencies: 247
-- Name: service_usage_service_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_usage_service_usage_id_seq', 46, true);


--
-- TOC entry 5577 (class 0 OID 0)
-- Dependencies: 249
-- Name: user_account_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_account_user_id_seq', 10, true);


--
-- TOC entry 5204 (class 2606 OID 27236)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 5206 (class 2606 OID 27238)
-- Name: booking booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT booking_pkey PRIMARY KEY (booking_id);


--
-- TOC entry 5217 (class 2606 OID 27240)
-- Name: branch branch_branch_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_branch_name_key UNIQUE (branch_name);


--
-- TOC entry 5219 (class 2606 OID 27242)
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- TOC entry 5281 (class 2606 OID 28490)
-- Name: checkin_validation checkin_validation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_validation
    ADD CONSTRAINT checkin_validation_pkey PRIMARY KEY (validation_id);


--
-- TOC entry 5222 (class 2606 OID 27244)
-- Name: customer customer_guest_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_guest_id_key UNIQUE (guest_id);


--
-- TOC entry 5224 (class 2606 OID 27246)
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 5226 (class 2606 OID 27248)
-- Name: customer customer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_user_id_key UNIQUE (user_id);


--
-- TOC entry 5228 (class 2606 OID 27250)
-- Name: employee employee_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_email_key UNIQUE (email);


--
-- TOC entry 5230 (class 2606 OID 27252)
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- TOC entry 5232 (class 2606 OID 27254)
-- Name: employee employee_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_user_id_key UNIQUE (user_id);


--
-- TOC entry 5276 (class 2606 OID 28462)
-- Name: group_booking group_booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_booking
    ADD CONSTRAINT group_booking_pkey PRIMARY KEY (group_booking_id);


--
-- TOC entry 5234 (class 2606 OID 27258)
-- Name: guest guest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest
    ADD CONSTRAINT guest_pkey PRIMARY KEY (guest_id);


--
-- TOC entry 5288 (class 2606 OID 28523)
-- Name: id_validation_rules id_validation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.id_validation_rules
    ADD CONSTRAINT id_validation_rules_pkey PRIMARY KEY (rule_id);


--
-- TOC entry 5238 (class 2606 OID 27260)
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- TOC entry 5215 (class 2606 OID 27262)
-- Name: booking no_overlapping_bookings; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (room_id WITH =, daterange(check_in_date, check_out_date, '[)'::text) WITH &&) WHERE ((status = ANY (ARRAY['Booked'::public.booking_status, 'Checked-In'::public.booking_status]))) DEFERRABLE;


--
-- TOC entry 5246 (class 2606 OID 27265)
-- Name: payment_adjustment payment_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustment
    ADD CONSTRAINT payment_adjustment_pkey PRIMARY KEY (adjustment_id);


--
-- TOC entry 5242 (class 2606 OID 27267)
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 5254 (class 2606 OID 27269)
-- Name: pre_booking pre_booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT pre_booking_pkey PRIMARY KEY (pre_booking_id);


--
-- TOC entry 5257 (class 2606 OID 27271)
-- Name: room room_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_pkey PRIMARY KEY (room_id);


--
-- TOC entry 5259 (class 2606 OID 27273)
-- Name: room_type room_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_type
    ADD CONSTRAINT room_type_name_key UNIQUE (name);


--
-- TOC entry 5261 (class 2606 OID 27275)
-- Name: room_type room_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_type
    ADD CONSTRAINT room_type_pkey PRIMARY KEY (room_type_id);


--
-- TOC entry 5263 (class 2606 OID 27277)
-- Name: service_catalog service_catalog_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_catalog
    ADD CONSTRAINT service_catalog_code_key UNIQUE (code);


--
-- TOC entry 5265 (class 2606 OID 27279)
-- Name: service_catalog service_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_catalog
    ADD CONSTRAINT service_catalog_pkey PRIMARY KEY (service_id);


--
-- TOC entry 5268 (class 2606 OID 27281)
-- Name: service_usage service_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_usage
    ADD CONSTRAINT service_usage_pkey PRIMARY KEY (service_usage_id);


--
-- TOC entry 5270 (class 2606 OID 27283)
-- Name: user_account user_account_guest_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_guest_id_key UNIQUE (guest_id);


--
-- TOC entry 5272 (class 2606 OID 27285)
-- Name: user_account user_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5274 (class 2606 OID 27287)
-- Name: user_account user_account_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_username_key UNIQUE (username);


--
-- TOC entry 5244 (class 1259 OID 27288)
-- Name: idx_adjust_booking; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_adjust_booking ON public.payment_adjustment USING btree (booking_id);


--
-- TOC entry 5207 (class 1259 OID 28424)
-- Name: idx_booking_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_branch_id ON public.booking USING btree (branch_id);


--
-- TOC entry 5208 (class 1259 OID 27289)
-- Name: idx_booking_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_created_at ON public.booking USING btree (created_at);


--
-- TOC entry 5209 (class 1259 OID 28439)
-- Name: idx_booking_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_dates ON public.booking USING btree (check_in_date, check_out_date);


--
-- TOC entry 5210 (class 1259 OID 28476)
-- Name: idx_booking_group_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_group_booking_id ON public.booking USING btree (group_booking_id);


--
-- TOC entry 5211 (class 1259 OID 28436)
-- Name: idx_booking_guest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_guest_id ON public.booking USING btree (guest_id);


--
-- TOC entry 5212 (class 1259 OID 28477)
-- Name: idx_booking_is_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_is_group ON public.booking USING btree (is_group_booking);


--
-- TOC entry 5213 (class 1259 OID 28438)
-- Name: idx_booking_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_status ON public.booking USING btree (status);


--
-- TOC entry 5282 (class 1259 OID 28506)
-- Name: idx_checkin_validation_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_validation_booking_id ON public.checkin_validation USING btree (booking_id);


--
-- TOC entry 5283 (class 1259 OID 28509)
-- Name: idx_checkin_validation_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_validation_created_at ON public.checkin_validation USING btree (created_at);


--
-- TOC entry 5284 (class 1259 OID 28507)
-- Name: idx_checkin_validation_guest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_validation_guest_id ON public.checkin_validation USING btree (guest_id);


--
-- TOC entry 5285 (class 1259 OID 28508)
-- Name: idx_checkin_validation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_validation_status ON public.checkin_validation USING btree (validation_status);


--
-- TOC entry 5277 (class 1259 OID 28474)
-- Name: idx_group_booking_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_booking_contact ON public.group_booking USING btree (group_contact_person);


--
-- TOC entry 5278 (class 1259 OID 28475)
-- Name: idx_group_booking_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_booking_created_at ON public.group_booking USING btree (created_at);


--
-- TOC entry 5279 (class 1259 OID 28473)
-- Name: idx_group_booking_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_booking_name ON public.group_booking USING btree (group_name);


--
-- TOC entry 5235 (class 1259 OID 28440)
-- Name: idx_guest_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guest_email ON public.guest USING btree (email);


--
-- TOC entry 5239 (class 1259 OID 28442)
-- Name: idx_payment_method_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_method_date ON public.payment USING btree (method, paid_at);


--
-- TOC entry 5247 (class 1259 OID 28548)
-- Name: idx_pre_booking_auto_cancel_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_auto_cancel_date ON public.pre_booking USING btree (auto_cancel_date);


--
-- TOC entry 5248 (class 1259 OID 27290)
-- Name: idx_pre_booking_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_created_at ON public.pre_booking USING btree (created_at);


--
-- TOC entry 5249 (class 1259 OID 27397)
-- Name: idx_pre_booking_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_customer_id ON public.pre_booking USING btree (customer_id);


--
-- TOC entry 5250 (class 1259 OID 28478)
-- Name: idx_pre_booking_is_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_is_group ON public.pre_booking USING btree (is_group_booking);


--
-- TOC entry 5251 (class 1259 OID 27398)
-- Name: idx_pre_booking_room_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_room_type_id ON public.pre_booking USING btree (room_type_id);


--
-- TOC entry 5252 (class 1259 OID 28547)
-- Name: idx_pre_booking_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pre_booking_status ON public.pre_booking USING btree (status);


--
-- TOC entry 5255 (class 1259 OID 28530)
-- Name: idx_room_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_room_status ON public.room USING btree (status);


--
-- TOC entry 5266 (class 1259 OID 28437)
-- Name: idx_service_usage_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_usage_booking_id ON public.service_usage USING btree (booking_id);


--
-- TOC entry 5240 (class 1259 OID 27291)
-- Name: payment_paidat_ix; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_paidat_ix ON public.payment USING btree (paid_at);


--
-- TOC entry 5243 (class 1259 OID 27292)
-- Name: uq_booking_payment_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_booking_payment_ref ON public.payment USING btree (booking_id, payment_reference);


--
-- TOC entry 5220 (class 1259 OID 27293)
-- Name: uq_branch_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_branch_code ON public.branch USING btree (branch_code);


--
-- TOC entry 5286 (class 1259 OID 28510)
-- Name: uq_checkin_validation_booking_guest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_checkin_validation_booking_guest ON public.checkin_validation USING btree (booking_id, guest_id);


--
-- TOC entry 5236 (class 1259 OID 28479)
-- Name: uq_guest_id_proof_enhanced; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_guest_id_proof_enhanced ON public.guest USING btree (id_proof_type, id_proof_number) WHERE ((id_proof_type IS NOT NULL) AND (id_proof_number IS NOT NULL) AND ((id_proof_number)::text <> ''::text));


--
-- TOC entry 5317 (class 2620 OID 27294)
-- Name: booking booking_min_advance_guard; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER booking_min_advance_guard BEFORE INSERT OR UPDATE OF check_in_date, check_out_date, booked_rate, advance_payment ON public.booking FOR EACH ROW EXECUTE FUNCTION public.trg_check_min_advance();


--
-- TOC entry 5318 (class 2620 OID 27295)
-- Name: booking refund_advance_on_cancel; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER refund_advance_on_cancel AFTER UPDATE OF status ON public.booking FOR EACH ROW EXECUTE FUNCTION public.trg_refund_advance_on_cancel();


--
-- TOC entry 5319 (class 2620 OID 27296)
-- Name: booking refund_advance_policy; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER refund_advance_policy AFTER UPDATE OF status ON public.booking FOR EACH ROW EXECUTE FUNCTION public.trg_refund_advance_policy();


--
-- TOC entry 5320 (class 2620 OID 28512)
-- Name: booking trigger_create_checkin_validation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_create_checkin_validation AFTER UPDATE ON public.booking FOR EACH ROW EXECUTE FUNCTION public.create_checkin_validation();


--
-- TOC entry 5321 (class 2620 OID 28531)
-- Name: room trigger_set_room_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_set_room_number BEFORE INSERT ON public.room FOR EACH ROW EXECUTE FUNCTION public.set_room_number();


--
-- TOC entry 5578 (class 0 OID 0)
-- Dependencies: 5321
-- Name: TRIGGER trigger_set_room_number ON room; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trigger_set_room_number ON public.room IS 'Automatically assigns room numbers when creating new rooms';


--
-- TOC entry 5289 (class 2606 OID 27302)
-- Name: booking fk_book_pre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT fk_book_pre FOREIGN KEY (pre_booking_id) REFERENCES public.pre_booking(pre_booking_id);


--
-- TOC entry 5290 (class 2606 OID 27307)
-- Name: booking fk_book_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT fk_book_room FOREIGN KEY (room_id) REFERENCES public.room(room_id);


--
-- TOC entry 5291 (class 2606 OID 28468)
-- Name: booking fk_booking_group_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT fk_booking_group_booking FOREIGN KEY (group_booking_id) REFERENCES public.group_booking(group_booking_id) ON DELETE SET NULL;


--
-- TOC entry 5292 (class 2606 OID 28418)
-- Name: booking fk_booking_guest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT fk_booking_guest FOREIGN KEY (guest_id) REFERENCES public.guest(guest_id) ON DELETE SET NULL;


--
-- TOC entry 5293 (class 2606 OID 28403)
-- Name: booking fk_booking_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking
    ADD CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES public.room(room_id) ON DELETE SET NULL;


--
-- TOC entry 5314 (class 2606 OID 28491)
-- Name: checkin_validation fk_checkin_validation_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_validation
    ADD CONSTRAINT fk_checkin_validation_booking FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id) ON DELETE CASCADE;


--
-- TOC entry 5315 (class 2606 OID 28501)
-- Name: checkin_validation fk_checkin_validation_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_validation
    ADD CONSTRAINT fk_checkin_validation_employee FOREIGN KEY (validated_by_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- TOC entry 5316 (class 2606 OID 28496)
-- Name: checkin_validation fk_checkin_validation_guest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_validation
    ADD CONSTRAINT fk_checkin_validation_guest FOREIGN KEY (guest_id) REFERENCES public.guest(guest_id) ON DELETE CASCADE;


--
-- TOC entry 5294 (class 2606 OID 28431)
-- Name: customer fk_cust_guest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT fk_cust_guest FOREIGN KEY (guest_id) REFERENCES public.guest(guest_id) ON DELETE RESTRICT;


--
-- TOC entry 5295 (class 2606 OID 27317)
-- Name: customer fk_cust_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES public.user_account(user_id);


--
-- TOC entry 5296 (class 2606 OID 27322)
-- Name: employee fk_emp_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- TOC entry 5297 (class 2606 OID 27327)
-- Name: employee fk_emp_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES public.user_account(user_id);


--
-- TOC entry 5313 (class 2606 OID 28463)
-- Name: group_booking fk_group_booking_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_booking
    ADD CONSTRAINT fk_group_booking_employee FOREIGN KEY (created_by_employee_id) REFERENCES public.employee(employee_id) ON DELETE SET NULL;


--
-- TOC entry 5298 (class 2606 OID 27332)
-- Name: invoice fk_inv_book; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_inv_book FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id);


--
-- TOC entry 5299 (class 2606 OID 27337)
-- Name: payment fk_pay_book; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT fk_pay_book FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id);


--
-- TOC entry 5301 (class 2606 OID 27387)
-- Name: pre_booking fk_pre_booking_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_pre_booking_customer FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id) ON DELETE RESTRICT;


--
-- TOC entry 5302 (class 2606 OID 27392)
-- Name: pre_booking fk_pre_booking_room_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_pre_booking_room_type FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id) ON DELETE RESTRICT;


--
-- TOC entry 5303 (class 2606 OID 27342)
-- Name: pre_booking fk_pre_creator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_pre_creator FOREIGN KEY (created_by_employee_id) REFERENCES public.employee(employee_id);


--
-- TOC entry 5304 (class 2606 OID 28426)
-- Name: pre_booking fk_pre_guest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_pre_guest FOREIGN KEY (guest_id) REFERENCES public.guest(guest_id) ON DELETE SET NULL;


--
-- TOC entry 5305 (class 2606 OID 27352)
-- Name: pre_booking fk_pre_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_pre_room FOREIGN KEY (room_id) REFERENCES public.room(room_id);


--
-- TOC entry 5306 (class 2606 OID 28549)
-- Name: pre_booking fk_prebooking_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pre_booking
    ADD CONSTRAINT fk_prebooking_branch FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- TOC entry 5307 (class 2606 OID 27357)
-- Name: room fk_room_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT fk_room_branch FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- TOC entry 5308 (class 2606 OID 28408)
-- Name: room fk_room_room_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT fk_room_room_type FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id) ON DELETE RESTRICT;


--
-- TOC entry 5309 (class 2606 OID 27362)
-- Name: room fk_room_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT fk_room_type FOREIGN KEY (room_type_id) REFERENCES public.room_type(room_type_id);


--
-- TOC entry 5310 (class 2606 OID 27367)
-- Name: service_usage fk_usage_book; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_usage
    ADD CONSTRAINT fk_usage_book FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id);


--
-- TOC entry 5311 (class 2606 OID 27372)
-- Name: service_usage fk_usage_serv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_usage
    ADD CONSTRAINT fk_usage_serv FOREIGN KEY (service_id) REFERENCES public.service_catalog(service_id);


--
-- TOC entry 5312 (class 2606 OID 27377)
-- Name: user_account fk_user_guest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT fk_user_guest FOREIGN KEY (guest_id) REFERENCES public.guest(guest_id);


--
-- TOC entry 5300 (class 2606 OID 27382)
-- Name: payment_adjustment payment_adjustment_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_adjustment
    ADD CONSTRAINT payment_adjustment_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id) ON DELETE CASCADE;


-- Completed on 2025-10-21 14:27:17

--
-- PostgreSQL database dump complete
--

\unrestrict 0LmlvcpOpJJjJKm9gAB870lB3nxwLg6strqn9YZBDxsGepGMvxN3wnJZ0ozaDM2

