--
-- PostgreSQL database dump
--

\restrict WJlgNbYOnHlZjcJkuQCZepqlESykRq9fGQoo2jaGb9ZkSyIvtfwJXfzPFPiXBov

-- Dumped from database version 16.12 (Debian 16.12-1.pgdg13+1)
-- Dumped by pg_dump version 16.12 (Debian 16.12-1.pgdg13+1)

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
-- Name: ComponentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ComponentType" AS ENUM (
    'EARNING',
    'DEDUCTION'
);


ALTER TYPE public."ComponentType" OWNER TO postgres;

--
-- Name: LeaveStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED_BY_MANAGER',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."LeaveStatus" OWNER TO postgres;

--
-- Name: PayrollStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayrollStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED'
);


ALTER TYPE public."PayrollStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'EMPLOYEE'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    day text NOT NULL,
    shift text,
    "inTime" text,
    "outTime" text,
    "workOT" text,
    overtime text,
    "lessHrs" text,
    status text NOT NULL,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    name text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "fileType" text NOT NULL,
    "folderId" text,
    "uploaderId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Document" OWNER TO postgres;

--
-- Name: DocumentShare; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DocumentShare" (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "userId" text NOT NULL,
    "sharedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DocumentShare" OWNER TO postgres;

--
-- Name: EmployeeBalance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmployeeBalance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "balanceDays" integer NOT NULL
);


ALTER TABLE public."EmployeeBalance" OWNER TO postgres;

--
-- Name: EmployeeComponentValue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmployeeComponentValue" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "componentId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."EmployeeComponentValue" OWNER TO postgres;

--
-- Name: Folder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Folder" (
    id text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Folder" OWNER TO postgres;

--
-- Name: FormSection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FormSection" (
    id text NOT NULL,
    name text NOT NULL,
    identifier text NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."FormSection" OWNER TO postgres;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO postgres;

--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeaveRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "daysRequested" integer NOT NULL,
    status public."LeaveStatus" DEFAULT 'PENDING'::public."LeaveStatus" NOT NULL,
    reason text,
    "approverId" text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    comments text,
    stage integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."LeaveRequest" OWNER TO postgres;

--
-- Name: LeaveType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeaveType" (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LeaveType" OWNER TO postgres;

--
-- Name: PayrollCycle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayrollCycle" (
    id text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    status public."PayrollStatus" DEFAULT 'DRAFT'::public."PayrollStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PayrollCycle" OWNER TO postgres;

--
-- Name: PayrollEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayrollEntry" (
    id text NOT NULL,
    "payrollCycleId" text NOT NULL,
    "employeeId" text NOT NULL,
    leaves integer DEFAULT 0 NOT NULL,
    "workingDays" integer NOT NULL,
    "grossEarnings" numeric(10,2) NOT NULL,
    "totalDeductions" numeric(10,2) NOT NULL,
    "netMonthlySalary" numeric(10,2) NOT NULL,
    "finalPayable" numeric(10,2) NOT NULL,
    "payslipPath" text
);


ALTER TABLE public."PayrollEntry" OWNER TO postgres;

--
-- Name: PayrollLineItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayrollLineItem" (
    id text NOT NULL,
    "payrollEntryId" text NOT NULL,
    "componentId" text,
    amount numeric(10,2) NOT NULL,
    "componentNameSnapshot" text NOT NULL,
    "componentTypeSnapshot" public."ComponentType" NOT NULL,
    "isVariableAdjustment" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."PayrollLineItem" OWNER TO postgres;

--
-- Name: SalaryComponent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalaryComponent" (
    id text NOT NULL,
    name text NOT NULL,
    type public."ComponentType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isVariable" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."SalaryComponent" OWNER TO postgres;

--
-- Name: TaxCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TaxCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TaxCategory" OWNER TO postgres;

--
-- Name: TaxDeclaration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TaxDeclaration" (
    id text NOT NULL,
    "userId" text NOT NULL,
    year integer NOT NULL,
    category text NOT NULL,
    "itemName" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "isProvisional" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."TaxDeclaration" OWNER TO postgres;

--
-- Name: TaxProjectionRow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TaxProjectionRow" (
    id text NOT NULL,
    label text NOT NULL,
    formula text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TaxProjectionRow" OWNER TO postgres;

--
-- Name: TenantConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TenantConfig" (
    id text NOT NULL,
    "companyName" text DEFAULT 'My Company'::text NOT NULL,
    "companyAddress" text,
    "companyPan" text,
    "companyLogoUrl" text,
    "toolName" text DEFAULT 'NexPayroll'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "watermarkEnabled" boolean DEFAULT false NOT NULL,
    "watermarkText" text DEFAULT 'NexPayroll'::text NOT NULL
);


ALTER TABLE public."TenantConfig" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'EMPLOYEE'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "managerId" text,
    "accountNumber" text,
    "bankName" text,
    "dateOfJoining" timestamp(3) without time zone,
    designation text,
    "employeeCode" text,
    "ifscCode" text,
    pan text,
    "pfNumber" text,
    department text,
    "photoUrl" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (id, "employeeId", date, day, shift, "inTime", "outTime", "workOT", overtime, "lessHrs", status, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Document" (id, name, "filePath", "fileSize", "fileType", "folderId", "uploaderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DocumentShare; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DocumentShare" (id, "documentId", "userId", "sharedAt") FROM stdin;
\.


--
-- Data for Name: EmployeeBalance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmployeeBalance" (id, "employeeId", "leaveTypeId", year, month, "balanceDays") FROM stdin;
\.


--
-- Data for Name: EmployeeComponentValue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmployeeComponentValue" (id, "employeeId", "componentId", amount, "isActive") FROM stdin;
\.


--
-- Data for Name: Folder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Folder" (id, name, "parentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FormSection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FormSection" (id, name, identifier, "isVisible", "order") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Holiday" (id, name, date, "createdAt") FROM stdin;
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeaveRequest" (id, "employeeId", "leaveTypeId", "startDate", "endDate", "daysRequested", status, reason, "approverId", "requestedAt", "approvedAt", comments, stage) FROM stdin;
\.


--
-- Data for Name: LeaveType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeaveType" (id, name, color, description, "isActive", "createdAt") FROM stdin;
cmlv85j5e00037rpgddl5qos5	Planned	#10B981	Planned/paid leave with monthly 2-day credit	t	2026-02-20 18:29:45.65
cmlv85j5q00047rpgxhiyy3pb	Sick	#EF4444	Sick leave - no balance limit	t	2026-02-20 18:29:45.662
cmlv85j5z00057rpg464fomfw	Casual	#F59E0B	Casual leave - no balance limit	t	2026-02-20 18:29:45.671
\.


--
-- Data for Name: PayrollCycle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayrollCycle" (id, year, month, status, "submittedAt", "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: PayrollEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayrollEntry" (id, "payrollCycleId", "employeeId", leaves, "workingDays", "grossEarnings", "totalDeductions", "netMonthlySalary", "finalPayable", "payslipPath") FROM stdin;
\.


--
-- Data for Name: PayrollLineItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayrollLineItem" (id, "payrollEntryId", "componentId", amount, "componentNameSnapshot", "componentTypeSnapshot", "isVariableAdjustment") FROM stdin;
\.


--
-- Data for Name: SalaryComponent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalaryComponent" (id, name, type, "isActive", "createdAt", "isVariable") FROM stdin;
cmlv85j4j00017rpgyd4lxwrr	Basic Pay	EARNING	t	2026-02-20 18:29:45.619	f
cmlv85j5200027rpg2y3700ab	Professional Tax	DEDUCTION	t	2026-02-20 18:29:45.638	f
\.


--
-- Data for Name: TaxCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TaxCategory" (id, name, description, "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: TaxDeclaration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TaxDeclaration" (id, "userId", year, category, "itemName", amount, "isProvisional") FROM stdin;
\.


--
-- Data for Name: TaxProjectionRow; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TaxProjectionRow" (id, label, formula, "order", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TenantConfig" (id, "companyName", "companyAddress", "companyPan", "companyLogoUrl", "toolName", "updatedAt", "watermarkEnabled", "watermarkText") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "passwordHash", role, "isActive", "createdAt", "updatedAt", "managerId", "accountNumber", "bankName", "dateOfJoining", designation, "employeeCode", "ifscCode", pan, "pfNumber", department, "photoUrl") FROM stdin;
cmlv85j3b00007rpguoj0qudp	System Admin	admin@local.test	$2a$10$BZHco3ZXKaqhkPDn6CzgPu1tUh7tsjjQzoajWmUSZsgyNtwwMf.9K	ADMIN	t	2026-02-20 18:29:45.575	2026-02-20 18:29:45.575	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: DocumentShare DocumentShare_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentShare"
    ADD CONSTRAINT "DocumentShare_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeBalance EmployeeBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeBalance"
    ADD CONSTRAINT "EmployeeBalance_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeComponentValue EmployeeComponentValue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeComponentValue"
    ADD CONSTRAINT "EmployeeComponentValue_pkey" PRIMARY KEY (id);


--
-- Name: Folder Folder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Folder"
    ADD CONSTRAINT "Folder_pkey" PRIMARY KEY (id);


--
-- Name: FormSection FormSection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FormSection"
    ADD CONSTRAINT "FormSection_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: LeaveType LeaveType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveType"
    ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY (id);


--
-- Name: PayrollCycle PayrollCycle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollCycle"
    ADD CONSTRAINT "PayrollCycle_pkey" PRIMARY KEY (id);


--
-- Name: PayrollEntry PayrollEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollEntry"
    ADD CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY (id);


--
-- Name: PayrollLineItem PayrollLineItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollLineItem"
    ADD CONSTRAINT "PayrollLineItem_pkey" PRIMARY KEY (id);


--
-- Name: SalaryComponent SalaryComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalaryComponent"
    ADD CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY (id);


--
-- Name: TaxCategory TaxCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaxCategory"
    ADD CONSTRAINT "TaxCategory_pkey" PRIMARY KEY (id);


--
-- Name: TaxDeclaration TaxDeclaration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaxDeclaration"
    ADD CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY (id);


--
-- Name: TaxProjectionRow TaxProjectionRow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaxProjectionRow"
    ADD CONSTRAINT "TaxProjectionRow_pkey" PRIMARY KEY (id);


--
-- Name: TenantConfig TenantConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TenantConfig"
    ADD CONSTRAINT "TenantConfig_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Attendance_employeeId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_employeeId_date_idx" ON public."Attendance" USING btree ("employeeId", date);


--
-- Name: Attendance_employeeId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON public."Attendance" USING btree ("employeeId", date);


--
-- Name: DocumentShare_documentId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DocumentShare_documentId_userId_key" ON public."DocumentShare" USING btree ("documentId", "userId");


--
-- Name: Document_folderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Document_folderId_idx" ON public."Document" USING btree ("folderId");


--
-- Name: EmployeeBalance_employeeId_leaveTypeId_year_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EmployeeBalance_employeeId_leaveTypeId_year_month_key" ON public."EmployeeBalance" USING btree ("employeeId", "leaveTypeId", year, month);


--
-- Name: EmployeeBalance_employeeId_year_month_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmployeeBalance_employeeId_year_month_idx" ON public."EmployeeBalance" USING btree ("employeeId", year, month);


--
-- Name: EmployeeComponentValue_employeeId_componentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EmployeeComponentValue_employeeId_componentId_key" ON public."EmployeeComponentValue" USING btree ("employeeId", "componentId");


--
-- Name: Folder_name_parentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Folder_name_parentId_key" ON public."Folder" USING btree (name, "parentId");


--
-- Name: Folder_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Folder_parentId_idx" ON public."Folder" USING btree ("parentId");


--
-- Name: FormSection_identifier_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FormSection_identifier_key" ON public."FormSection" USING btree (identifier);


--
-- Name: Holiday_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Holiday_date_key" ON public."Holiday" USING btree (date);


--
-- Name: LeaveRequest_employeeId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LeaveRequest_employeeId_status_idx" ON public."LeaveRequest" USING btree ("employeeId", status);


--
-- Name: LeaveRequest_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON public."LeaveRequest" USING btree ("startDate", "endDate");


--
-- Name: LeaveType_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LeaveType_name_key" ON public."LeaveType" USING btree (name);


--
-- Name: PayrollCycle_year_month_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PayrollCycle_year_month_key" ON public."PayrollCycle" USING btree (year, month);


--
-- Name: PayrollEntry_payrollCycleId_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PayrollEntry_payrollCycleId_employeeId_key" ON public."PayrollEntry" USING btree ("payrollCycleId", "employeeId");


--
-- Name: SalaryComponent_name_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SalaryComponent_name_type_key" ON public."SalaryComponent" USING btree (name, type);


--
-- Name: TaxCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TaxCategory_name_key" ON public."TaxCategory" USING btree (name);


--
-- Name: TaxDeclaration_userId_year_category_itemName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TaxDeclaration_userId_year_category_itemName_key" ON public."TaxDeclaration" USING btree ("userId", year, category, "itemName");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_employeeCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_employeeCode_key" ON public."User" USING btree ("employeeCode");


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentShare DocumentShare_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentShare"
    ADD CONSTRAINT "DocumentShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentShare DocumentShare_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DocumentShare"
    ADD CONSTRAINT "DocumentShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."Folder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_uploaderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmployeeBalance EmployeeBalance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeBalance"
    ADD CONSTRAINT "EmployeeBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeBalance EmployeeBalance_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeBalance"
    ADD CONSTRAINT "EmployeeBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeComponentValue EmployeeComponentValue_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeComponentValue"
    ADD CONSTRAINT "EmployeeComponentValue_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public."SalaryComponent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeComponentValue EmployeeComponentValue_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmployeeComponentValue"
    ADD CONSTRAINT "EmployeeComponentValue_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Folder Folder_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Folder"
    ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Folder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeaveRequest LeaveRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollEntry PayrollEntry_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollEntry"
    ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollEntry PayrollEntry_payrollCycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollEntry"
    ADD CONSTRAINT "PayrollEntry_payrollCycleId_fkey" FOREIGN KEY ("payrollCycleId") REFERENCES public."PayrollCycle"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollLineItem PayrollLineItem_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollLineItem"
    ADD CONSTRAINT "PayrollLineItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public."SalaryComponent"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayrollLineItem PayrollLineItem_payrollEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollLineItem"
    ADD CONSTRAINT "PayrollLineItem_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES public."PayrollEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaxDeclaration TaxDeclaration_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaxDeclaration"
    ADD CONSTRAINT "TaxDeclaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict WJlgNbYOnHlZjcJkuQCZepqlESykRq9fGQoo2jaGb9ZkSyIvtfwJXfzPFPiXBov

