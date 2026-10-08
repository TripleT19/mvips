"use client";

import Image from "next/image";
import {
  AlertCircle, ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2,
  ChevronDown, ClipboardCheck, FileCheck2, FileText, GraduationCap,
  HeartHandshake, Info, LockKeyhole, Mail, Printer, Save, Search,
  ShieldCheck, Stethoscope, Upload, UserRound, Users, X,
} from "lucide-react";
import {
  ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "mountview_admission_application";

type ParentGuardian = {
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  occupation: string;
  position_title: string;
  employer: string;
  work_address: string;
  work_phone: string;
  employer_pays_fees: boolean;
  employer_payment_percentage: string;
  physical_address: string;
  postal_address: string;
  emergency_contact: boolean;
  preferred_communication: string;
  is_primary: boolean;
};

type StudentForm = {
  legal_first_name: string;
  middle_name: string;
  legal_surname: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  class_applied_for: string;
  weight: string;
  height: string;
  first_language: string;
  nationality: string;
  religion: string;
  emergency_contact: string;
  family_members_count: string;
  lives_with: string;
  existing_mount_view_children_count: string;
  siblings_at_mount_view: string[];
  email_with_mount_view: string;
  physical_address: string;

  /* Medical */
  medical_conditions: string;
  allergies: string;
  learning_needs: string;
  family_doctor_name: string;
  family_doctor_phone: string;
};

type PreviousSchool = {
  name: string;
  address: string;
  previous_class: string;
  last_year: string;
  reason_for_leaving: string;
  contact: string;
  country: string;
  instructional_language: string;
};

type Application = {
  student: StudentForm;
  parents: ParentGuardian[];
  previous_school: PreviousSchool;
  academic_year: string;
  source: "online" | "paper";
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  application_number?: string;
  access_token?: string;
  email_sent?: boolean;
  data?: any;
  application?: any;
  missing_documents?: string[];
  missing_document_labels?: string[];
};

type FieldErrors = Record<string, string>;

type DocumentSlot = {
  type: string;
  file: File | null;
  required: boolean;
  hint?: string;
};

const initialStudent: StudentForm = {
  legal_first_name: "",
  middle_name: "",
  legal_surname: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  class_applied_for: "",
  weight: "",
  height: "",
  first_language: "",
  nationality: "",
  religion: "",
  emergency_contact: "",
  family_members_count: "",
  lives_with: "",
  existing_mount_view_children_count: "",
  siblings_at_mount_view: [],
  email_with_mount_view: "",
  physical_address: "",
  medical_conditions: "",
  allergies: "",
  learning_needs: "",
  family_doctor_name: "",
  family_doctor_phone: "",
};

const initialParent: ParentGuardian = {
  full_name: "",
  relationship: "",
  phone: "",
  email: "",
  occupation: "",
  position_title: "",
  employer: "",
  work_address: "",
  work_phone: "",
  employer_pays_fees: false,
  employer_payment_percentage: "",
  physical_address: "",
  postal_address: "",
  emergency_contact: false,
  preferred_communication: "Phone",
  is_primary: true,
};

const initialPreviousSchool: PreviousSchool = {
  name: "",
  address: "",
  previous_class: "",
  last_year: "",
  reason_for_leaving: "",
  contact: "",
  country: "",
  instructional_language: "",
};

const initialApplication: Application = {
  student: { ...initialStudent },
  parents: [{ ...initialParent }],
  previous_school: { ...initialPreviousSchool },
  academic_year: "2027",
  source: "online",
};

const initialDocuments: DocumentSlot[] = [
  {
    type: "birth_certificate_or_passport",
    file: null,
    required: true,
  },
  {
    type: "passport_photograph_1",
    file: null,
    required: true,
  },
  {
    type: "passport_photograph_2",
    file: null,
    required: true,
  },
  {
    type: "school_report",
    file: null,
    required: false,
    hint:
      "Not required for students starting in Reception or with no previous school history.",
  },
];

const steps = [
  { number: 1, title: "Student Details", icon: UserRound },
  { number: 2, title: "Parents & Guardians", icon: Users },
  { number: 3, title: "Previous School", icon: GraduationCap },
  { number: 4, title: "Documents", icon: FileCheck2 },
  { number: 5, title: "Review & Submit", icon: ClipboardCheck },
];

const classOptions = [
  "Early Years",
  "Nursery",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];

const documentLabels: Record<string, string> = {
  birth_certificate_or_passport:
    "Birth Certificate or Main Passport Pages",
  passport_photograph_1: "Passport Photograph 1",
  passport_photograph_2: "Passport Photograph 2",
  school_report: "Original Mark Sheets / School Report",
};

const TERMS_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Terms and Conditions of Entry",
    items: [
      "Mount View will not accept or review applications that are not signed and accompanied by all documents required (refer to the first page).",
      "Upon receipt of the application, we will contact you with a date and time for the entry assessment and interview.",
      "Upon receipt of the admissions email, students entering school at the beginning of the academic year will have one week to pay the required instalment. Students entering midyear will be requested to pay before the first day of attending the school (this may vary depending on entry date).",
      "Official enrolment into the school will only take place after payment of the first instalment.",
      "If the Head teacher, upon enquiry, satisfies himself/herself that any student has committed a serious offence or has permanently intended to cause harm to the school, the Head teacher may, if they think fit, request the parents to remove him or her from the school.",
      "Parents/Guardians are required to ensure that they provide the students with the full school uniform, P.E. Uniform and Swimming Uniform and equipment as published in the school clothing list, and to ensure that their children conform to school rules with regard to the wearing of the same.",
      "Students must come to school with the correct equipment including stationery, dictionary, thesaurus and calculator where indicated.",
      "Students that choose to attend clubs may be asked to provide items to engage in the club fully.",
      "All students are expected to conform to the published student's expectations as laid down by the school. Failure to conform to these expectations will result in action being taken against the student.",
      "At least one term's notice, in writing, of the intention to remove a student must be given to the Head of the school. In the event of this not being given, one term's fees will be paid.",
      "The parents or guardians of the student will at all times indemnify the school against all actions, claims, proceedings, costs and expenses in respect of the student or personal injury to the student arising out of any activity or transport facility provided or arranged by the school and/or whilst the student is under supervision both within and out of the school site.",
      "Students will participate in off-campus trips and sports events both during school time and at times via arrangement outside of school hours.",
      "The school or teachers cannot be held legally or otherwise responsible for any loss or damage of property or physical injury caused by an accident or otherwise.",
      "All trips and activities are part of the advanced programme and compulsory.",
      "Parents and guardians do accept that the school has the authority to take photographs of students for exclusive use by the school for monitoring and publicity purposes.",
      "School policies on out-of-school behaviour are to be adhered to at all times.",
      "Parents and family members will regularly check the class and school's communication app for personal information and updates.",
      "Students arrive promptly by 6:30 am and are collected at the end of the school day: Monday to Thursday at 12:30 pm and on Friday at 11:30 am.",
    ],
  },
  {
    title: "Exam Policy",
    items: [
      "Any pupil absent from school due to reasons other than sickness will NOT be allowed to sit for exams.",
      "Any pupil absent with a qualifying sickness must provide a doctor's note.",
      "The pupil must be in school full time.",
      "Parents must ensure that all fees are paid and that pupils who have brothers or sisters in the school are not disadvantaged.",
      "Students will not be eligible for any school awards.",
    ],
  },
];

const TERMS_AGREEMENT_STATEMENT =
  "I acknowledge that I have read and agree to the Terms and Conditions of Mount View International Primary School. I undertake to pay the fees and any due charges. I understand that the school calendar will not be issued unless this form is signed.";

function getStoredApplication(): {
  application_number?: string;
  access_token?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch { return null; }
}

function storeApplicationCredentials(num: string, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    application_number: num, access_token: token,
  }));
}

async function parseResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    throw new Error(
      "The server returned an invalid response. Please check that the Laravel API is running."
    );
  }
}

function getImagePreview(file: File | null) {
  if (!file || typeof window === "undefined") return null;
  return URL.createObjectURL(file);
}

function formatDateDisplay(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return String(v); }
}

function formatDateTimeDisplay(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(v); }
}

export default function AdmissionsPage() {
  const [mode, setMode] = useState<
    "landing" | "application" | "track" | "status"
  >("landing");
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] =
    useState<Application>(initialApplication);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [trackToken, setTrackToken] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<any | null>(null);
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [existingPhoto, setExistingPhoto] = useState(false);
  const [documents, setDocuments] = useState<DocumentSlot[]>(initialDocuments);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, boolean>
  >({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [startEmail, setStartEmail] = useState("");
  const [emailModalError, setEmailModalError] = useState("");
  const [startingEmail, setStartingEmail] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendError, setResendError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showToken, setShowToken] = useState(false);

  const photoPreview = useMemo(
    () => getImagePreview(studentPhoto), [studentPhoto]
  );
  const errorRefs = useRef<Record<string, HTMLElement | null>>({});
  const generalErrorRef = useRef<HTMLDivElement | null>(null);

  const registerErrorRef = (key: string, element: HTMLElement | null) => {
    errorRefs.current[key] = element;
  };

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow =
      showTermsModal || showEmailModal || showResendModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showTermsModal, showEmailModal, showResendModal]);

  function clearFieldErrors() { setFieldErrors({}); }
  function clearMessages() {
    setErrorMessage(""); setSuccessMessage(""); clearFieldErrors();
  }

  function setGeneralError(message: string) {
    setErrorMessage(message);
    requestAnimationFrame(() => {
      generalErrorRef.current?.scrollIntoView({
        behavior: "smooth", block: "center",
      });
    });
  }

  function setFieldError(key: string, message: string, step?: number) {
    setFieldErrors({ [key]: message });
    setErrorMessage("");
    if (step) setCurrentStep(step);
    requestAnimationFrame(() => {
      const element = errorRefs.current[key];
      if (!element) {
        generalErrorRef.current?.scrollIntoView({
          behavior: "smooth", block: "center",
        });
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = element.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea");
      if (focusable) {
        setTimeout(() => focusable.focus({ preventScroll: true }), 250);
      }
    });
  }

  function updateStudent(field: keyof StudentForm, value: any) {
    setApplication((current) => ({
      ...current,
      student: { ...current.student, [field]: value },
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`student.${field}`];
      return next;
    });
  }

  function updateSibling(index: number, value: string) {
    setApplication((current) => {
      const siblings = [...current.student.siblings_at_mount_view];
      siblings[index] = value;
      return {
        ...current,
        student: {
          ...current.student,
          siblings_at_mount_view: siblings,
        },
      };
    });
  }

  function addSibling() {
    setApplication((current) => ({
      ...current,
      student: {
        ...current.student,
        siblings_at_mount_view: [
          ...current.student.siblings_at_mount_view, "",
        ],
      },
    }));
  }

  function removeSibling(index: number) {
    setApplication((current) => ({
      ...current,
      student: {
        ...current.student,
        siblings_at_mount_view:
          current.student.siblings_at_mount_view.filter(
            (_, i) => i !== index
          ),
      },
    }));
  }

  function handleChildrenCountChange(value: string) {
    setApplication((current) => {
      const count = Math.max(0, parseInt(value || "0", 10));
      const existing = current.student.siblings_at_mount_view || [];
      let siblings = [...existing];
      if (count > existing.length) {
        while (siblings.length < count) siblings.push("");
      } else if (count < existing.length) {
        siblings = siblings.slice(0, count);
      }
      return {
        ...current,
        student: {
          ...current.student,
          existing_mount_view_children_count: value,
          siblings_at_mount_view: siblings,
        },
      };
    });
  }

  function updatePreviousSchool(field: keyof PreviousSchool, value: string) {
    setApplication((current) => ({
      ...current,
      previous_school: { ...current.previous_school, [field]: value },
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`previous_school.${field}`];
      return next;
    });
  }

  function updateParent(
    index: number,
    field: keyof ParentGuardian,
    value: string | boolean
  ) {
    setApplication((current) => {
      const parents = [...current.parents];
      parents[index] = { ...parents[index], [field]: value };
      /* Clear percentage when employer_pays_fees is turned off */
      if (field === "employer_pays_fees" && value === false) {
        parents[index].employer_payment_percentage = "";
      }
      return { ...current, parents };
    });
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`parent.${index}.${field}`];
      return next;
    });
  }

  function addParent() {
    setApplication((current) => ({
      ...current,
      parents: [...current.parents, { ...initialParent, is_primary: false }],
    }));
  }

  function removeParent(index: number) {
    if (application.parents.length <= 1) return;
    setApplication((current) => ({
      ...current,
      parents: current.parents.filter((_, i) => i !== index),
    }));
    setFieldErrors((current) => {
      const next: FieldErrors = {};
      Object.entries(current).forEach(([key, value]) => {
        const match = key.match(/^parent\.(\d+)\.(.+)$/);
        if (!match) { next[key] = value; return; }
        const oldIndex = Number(match[1]);
        if (oldIndex === index) return;
        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
        next[`parent.${newIndex}.${match[2]}`] = value;
      });
      return next;
    });
  }

  function makeParentPrimary(index: number, checked: boolean) {
    setApplication((current) => ({
      ...current,
      parents: current.parents.map((parent, parentIndex) => ({
        ...parent,
        is_primary: checked ? parentIndex === index : parent.is_primary,
      })),
    }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setStudentPhoto(file);
    setPhotoUploaded(false);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.student_photo;
      return next;
    });
  }

  function handleDocumentChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;
    setDocuments((current) =>
      current.map((doc, i) => (i === index ? { ...doc, file } : doc))
    );
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`document.${index}`];
      return next;
    });
  }

  function clearDocument(index: number) {
    setDocuments((current) =>
      current.map((doc, i) => (i === index ? { ...doc, file: null } : doc))
    );
  }

  function validateStep(step: number): boolean {
    clearFieldErrors();
    if (step === 1) {
      const s = application.student;
      if (!s.legal_first_name.trim()) {
        setFieldError("student.legal_first_name",
          "Please enter the student's legal first name.", 1);
        return false;
      }
      if (!s.legal_surname.trim()) {
        setFieldError("student.legal_surname",
          "Please enter the student's legal surname.", 1);
        return false;
      }
      if (!s.date_of_birth) {
        setFieldError("student.date_of_birth",
          "Please enter the student's date of birth.", 1);
        return false;
      }
      if (!s.gender) {
        setFieldError("student.gender",
          "Please select the student's gender.", 1);
        return false;
      }
      if (!s.class_applied_for) {
        setFieldError("student.class_applied_for",
          "Please select the class being applied for.", 1);
        return false;
      }
      if (!s.physical_address.trim()) {
        setFieldError("student.physical_address",
          "Please enter the student's physical address.", 1);
        return false;
      }
      const hasPhoto = studentPhoto || existingPhoto || photoUploaded;
      if (!hasPhoto) {
        setFieldError("student_photo",
          "Please upload a passport-style photograph of the student.", 1);
        return false;
      }
      if (
        Number(s.existing_mount_view_children_count || 0) >= 1 &&
        !s.email_with_mount_view.trim()
      ) {
        setFieldError("student.email_with_mount_view",
          "Please provide the email registered on your Mount View parent account.", 1);
        return false;
      }
    }

    if (step === 2) {
      if (application.parents.length === 0) {
        setFieldError("parents",
          "At least one parent or guardian is required.", 2);
        return false;
      }
      for (let index = 0; index < application.parents.length; index++) {
        const parent = application.parents[index];
        if (!parent.full_name.trim()) {
          setFieldError(`parent.${index}.full_name`,
            `Please enter the full name of Parent / Guardian ${index + 1}.`, 2);
          return false;
        }
        if (!parent.relationship.trim()) {
          setFieldError(`parent.${index}.relationship`,
            `Please provide the relationship for Parent / Guardian ${index + 1}.`, 2);
          return false;
        }
        if (!parent.phone.trim()) {
          setFieldError(`parent.${index}.phone`,
            `Please provide a phone number for Parent / Guardian ${index + 1}.`, 2);
          return false;
        }
        if (
          parent.employer_pays_fees &&
          !parent.employer_payment_percentage
        ) {
          setFieldError(
            `parent.${index}.employer_payment_percentage`,
            "Please enter the percentage the employer will pay.",
            2
          );
          return false;
        }
      }
    }

    if (step === 4) {
      for (let index = 0; index < documents.length; index++) {
        const doc = documents[index];
        if (!doc.required) continue;
        if (doc.file) continue;
        if (uploadedDocuments[doc.type]) continue;
        setFieldError(`document.${index}`,
          `Please upload ${documentLabels[doc.type] || doc.type} before continuing.`, 4);
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((c) => Math.min(c + 1, steps.length));
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  function previousStep() {
    clearFieldErrors();
    setCurrentStep((c) => Math.max(c - 1, 1));
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  async function startApplicationWithEmail() {
    setEmailModalError("");
    const email = startEmail.trim().toLowerCase();
    if (!email) {
      setEmailModalError("Please enter your email address."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailModalError("Please enter a valid email address."); return;
    }

    setStartingEmail(true); setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admissions/applications`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            academic_year: application.academic_year,
            source: "online",
          }),
        }
      );
      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Unable to start the application.");
      }
      const number =
        data.application_number || data.data?.application_number || "";
      const token =
        data.access_token || data.data?.access_token || "";
      if (!number || !token) {
        throw new Error(
          "The admissions server did not return an application number and access token."
        );
      }
      setApplicationNumber(number);
      setAccessToken(token);
      storeApplicationCredentials(number, token);
      setShowEmailModal(false);
      setMode("application");
      setCurrentStep(1);
      setSuccessMessage(
        data.email_sent
          ? "Your application has been created and we have emailed your access details."
          : "Your application has been created. Please copy and save the access details shown below."
      );
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      );
    } catch (error: any) {
      setEmailModalError(error?.message ||
        "Unable to connect to the admissions system.");
    } finally { setStartingEmail(false); setSaving(false); }
  }

  async function resendCredentials() {
    setResendError(""); setResendSuccess("");
    const email = resendEmail.trim().toLowerCase();
    if (!email) {
      setResendError("Please enter your email address."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResendError("Please enter a valid email address."); return;
    }
    setResending(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admissions/applications/resend-credentials`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );
      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Unable to resend credentials.");
      }
      setResendSuccess(
        data.message ||
          "If that email matches an application on file, we have emailed the access details."
      );
      setResendEmail("");
    } catch (error: any) {
      setResendError(error?.message || "Unable to resend credentials.");
    } finally { setResending(false); }
  }

  function buildSavePayload() {
    return {
      ...application,
      student: {
        ...application.student,
        class_applied_id: application.student.class_applied_for,
        siblings_at_mount_view:
          application.student.siblings_at_mount_view.filter(
            (n) => n.trim() !== ""
          ),
      },
      previous_school: {
        ...application.previous_school,
        previous_school_country:
          application.previous_school.country,
        previous_school_language:
          application.previous_school.instructional_language,
        previous_school_name:
          application.previous_school.name,
        previous_school_address:
          application.previous_school.address,
        previous_class:
          application.previous_school.previous_class,
        previous_year:
          application.previous_school.last_year,
        previous_school_contact:
          application.previous_school.contact,
      },
    };
  }

  async function uploadPhoto(): Promise<void> {
    if (!studentPhoto || !applicationNumber || !accessToken) return;
    const formData = new FormData();
    formData.append("photo", studentPhoto);
    const response = await fetch(
      `${API_URL}/api/admissions/applications/${encodeURIComponent(
        applicationNumber
      )}/photo`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Admission-Token": accessToken,
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        data?.message || "Unable to upload the student's photograph."
      );
    }
    setPhotoUploaded(true); setExistingPhoto(true);
  }

  async function uploadOneDocument(
    index: number, doc: DocumentSlot
  ): Promise<void> {
    if (!doc.file || !applicationNumber || !accessToken) return;
    const formData = new FormData();
    formData.append("document", doc.file);
    formData.append("document_type", doc.type);
    const response = await fetch(
      `${API_URL}/api/admissions/applications/${encodeURIComponent(
        applicationNumber
      )}/documents`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Admission-Token": accessToken,
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        data?.message ||
          `Unable to upload ${documentLabels[doc.type] || "the document"}.`
      );
    }
    setUploadedDocuments((current) => ({ ...current, [doc.type]: true }));
  }

  async function syncUnsavedFiles(): Promise<void> {
    if (!applicationNumber || !accessToken) return;
    if (studentPhoto && !photoUploaded) {
      try { await uploadPhoto(); }
      catch (error: any) {
        setFieldError("student_photo",
          error?.message || "Unable to upload the student's photograph.", 1);
        throw error;
      }
    }
    for (let index = 0; index < documents.length; index++) {
      const doc = documents[index];
      if (!doc.file) continue;
      if (uploadedDocuments[doc.type]) continue;
      try { await uploadOneDocument(index, doc); }
      catch (error: any) {
        setFieldError(`document.${index}`,
          error?.message ||
            `Unable to upload ${documentLabels[doc.type] || "the document"}.`,
          4);
        throw error;
      }
    }
  }

  async function saveApplication(): Promise<boolean> {
    if (!applicationNumber || !accessToken) {
      setGeneralError("Your application reference could not be found.");
      return false;
    }
    setSaving(true); setErrorMessage("");
    try {
      const response = await fetch(
        `${API_URL}/api/admissions/applications/${encodeURIComponent(
          applicationNumber
        )}/save`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Admission-Token": accessToken,
          },
          body: JSON.stringify(buildSavePayload()),
        }
      );
      const data = await parseResponse(response);
      if (!response.ok) {
        setGeneralError(
          data.message || "Unable to save your application."
        );
        return false;
      }
      storeApplicationCredentials(applicationNumber, accessToken);
      try { await syncUnsavedFiles(); } catch { return false; }
      setSuccessMessage("Your application has been saved successfully.");
      return true;
    } catch (error: any) {
      setGeneralError(error?.message || "Unable to save the application.");
      return false;
    } finally { setSaving(false); }
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    if (!termsViewed) {
      setFieldError("terms",
        "Please read and accept the Mount View terms and conditions before submitting.", 5);
      return;
    }
    if (!termsAccepted) {
      setFieldError("terms",
        "You must tick the box to confirm you accept the terms and conditions.", 5);
      return;
    }
    if (!applicationNumber || !accessToken) {
      setGeneralError(
        "Your application reference could not be found. Please retrieve or restart the application."
      );
      return;
    }
    if (!validateStep(1)) return;
    if (!validateStep(2)) return;
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      const saved = await saveApplication();
      if (!saved) return;

      const response = await fetch(
        `${API_URL}/api/admissions/applications/${encodeURIComponent(
          applicationNumber
        )}/submit`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Admission-Token": accessToken,
          },
          body: JSON.stringify({ terms_accepted: true }),
        }
      );
      const data = await parseResponse(response);
      if (!response.ok) {
        let errorMsg = data.message || "Unable to submit the application.";
        if (
          Array.isArray(data.missing_document_labels) &&
          data.missing_document_labels.length > 0
        ) {
          errorMsg = `The following documents are missing: ${data.missing_document_labels.join(", ")}.`;
        } else if (
          Array.isArray(data.missing_documents) &&
          data.missing_documents.length > 0
        ) {
          errorMsg = `The following documents are missing: ${data.missing_documents
            .map((t) => documentLabels[t] || t)
            .join(", ")}.`;
        }
        setGeneralError(errorMsg);
        return;
      }
      setSuccessMessage(
        "Your admission application has been submitted successfully."
      );
      setApplicationStatus(data.data || data.application || data);
      localStorage.removeItem(STORAGE_KEY);
      setMode("status");
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      );
    } catch (error: any) {
      setGeneralError(error?.message ||
        "There was a problem submitting your application.");
    } finally { setSubmitting(false); }
  }

  function normalizeRetrievedApplication(retrieved: any): Application {
    const student = retrieved?.student || {};
    const parents =
      Array.isArray(retrieved?.parents) && retrieved.parents.length
        ? retrieved.parents.map((parent: any) => ({
            full_name: parent.full_name || "",
            relationship: parent.relationship || "",
            phone: parent.phone_number || parent.phone || "",
            email: parent.email || "",
            occupation: parent.occupation || "",
            position_title: parent.position_title || "",
            employer: parent.employer || "",
            work_address: parent.work_address || "",
            work_phone: parent.work_phone || "",
            employer_pays_fees: Boolean(parent.employer_pays_fees),
            employer_payment_percentage:
              parent.employer_payment_percentage != null
                ? String(parent.employer_payment_percentage)
                : "",
            physical_address: parent.physical_address || "",
            postal_address: parent.postal_address || "",
            emergency_contact: Boolean(parent.emergency_contact),
            preferred_communication:
              parent.preferred_communication || "Phone",
            is_primary: Boolean(parent.is_primary),
          }))
        : [{ ...initialParent }];

    const academicYear =
      typeof retrieved?.academic_year === "object"
        ? retrieved.academic_year?.name
        : retrieved?.academic_year;

    return {
      student: {
        legal_first_name: student.legal_first_name || "",
        middle_name: student.middle_name || "",
        legal_surname: student.legal_surname || "",
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || "",
        blood_group: student.blood_group || "",
        class_applied_for:
          student.class_applied_for ||
          student.class_name ||
          student.class_applied_id || "",
        weight: student.weight || student.weight_kg || "",
        height: student.height || student.height_cm || "",
        first_language: student.first_language || "",
        nationality: student.nationality || "",
        religion: student.religion || "",
        emergency_contact: student.emergency_contact || "",
        family_members_count:
          student.family_members_count || student.family_member_count || "",
        lives_with:
          student.lives_with || student.student_lives_with || "",
        existing_mount_view_children_count:
          student.existing_mount_view_children_count ||
          student.children_at_mount_view || "",
        siblings_at_mount_view: Array.isArray(
          student.siblings_at_mount_view
        )
          ? student.siblings_at_mount_view
          : [],
        email_with_mount_view: student.email_with_mount_view || "",
        physical_address: student.physical_address || "",
        medical_conditions: student.medical_conditions || "",
        allergies: student.allergies || "",
        learning_needs: student.learning_needs || "",
        family_doctor_name: student.family_doctor_name || "",
        family_doctor_phone: student.family_doctor_phone || "",
      },
      parents,
      previous_school: {
        name: retrieved?.previous_school?.name || "",
        address: retrieved?.previous_school?.address || "",
        previous_class:
          retrieved?.previous_school?.previous_class || "",
        last_year: retrieved?.previous_school?.last_year || "",
        reason_for_leaving:
          retrieved?.previous_school?.reason_for_leaving || "",
        contact: retrieved?.previous_school?.contact || "",
        country: retrieved?.previous_school?.country || "",
        instructional_language:
          retrieved?.previous_school?.instructional_language || "",
      },
      academic_year: academicYear || "2027",
      source:
        retrieved?.source === "paper" ? "paper" : "online",
    };
  }

  async function retrieveApplication(number: string, token: string) {
    const cleanNumber = number.trim();
    const cleanToken = token.trim();
    if (!cleanNumber || !cleanToken) {
      throw new Error(
        "Please enter your application number and access token."
      );
    }
    const response = await fetch(
      `${API_URL}/api/admissions/applications/${encodeURIComponent(
        cleanNumber
      )}/track`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Admission-Token": cleanToken,
        },
        body: JSON.stringify({}),
      }
    );
    const data = await parseResponse(response);
    if (!response.ok) {
      throw new Error(data.message || "We could not retrieve your application.");
    }
    const retrieved = data.data || data.application || data;

    setApplicationNumber(retrieved.application_number || cleanNumber);
    setAccessToken(cleanToken);
    setApplication(normalizeRetrievedApplication(retrieved));
    setApplicationStatus(retrieved);

    const hasPhoto = Boolean(
      retrieved?.student?.has_photo || retrieved?.has_photo
    );
    setExistingPhoto(hasPhoto);
    setPhotoUploaded(false);

    const uploaded: Record<string, boolean> = {};
    if (Array.isArray(retrieved?.documents)) {
      retrieved.documents.forEach((doc: any) => {
        if (doc?.document_type) uploaded[doc.document_type] = true;
      });
    }
    setUploadedDocuments(uploaded);

    storeApplicationCredentials(
      retrieved.application_number || cleanNumber, cleanToken
    );

    const retrievedStatus = String(retrieved.status || "draft");
    if (retrievedStatus === "draft") {
      setMode("application");
      setCurrentStep(1);
      setSuccessMessage(
        "Your existing application has been retrieved successfully. You can continue editing it."
      );
    } else {
      setMode("status");
      setSuccessMessage("");
    }
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  async function continueExistingApplication() {
    const stored = getStoredApplication();
    clearMessages();
    if (!stored?.application_number || !stored?.access_token) {
      setMode("track"); return;
    }
    setSaving(true);
    try {
      await retrieveApplication(
        stored.application_number, stored.access_token
      );
    } catch (error: any) {
      localStorage.removeItem(STORAGE_KEY);
      setTrackNumber(stored.application_number);
      setTrackToken(stored.access_token);
      setMode("track");
      setGeneralError(error?.message ||
        "We could not retrieve your saved application.");
    } finally { setSaving(false); }
  }

  async function trackApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setApplicationStatus(null);
    setTracking(true);
    try { await retrieveApplication(trackNumber, trackToken); }
    catch (error: any) {
      setGeneralError(error?.message || "Unable to track your application.");
    } finally { setTracking(false); }
  }

  /* ================================================================== */
  /* Shared renderers                                                    */
  /* ================================================================== */

  function renderError() {
    if (!errorMessage) return null;
    return (
      <div ref={generalErrorRef} role="alert" aria-live="assertive"
        className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
        <AlertCircle className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-medium">{errorMessage}</p>
        <button type="button" onClick={() => setErrorMessage("")}
          className="ml-auto shrink-0 rounded-lg p-1 hover:bg-red-100" aria-label="Close error">
          <X size={18} />
        </button>
      </div>
    );
  }

  function renderSuccess() {
    if (!successMessage) return null;
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
        <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-medium">{successMessage}</p>
        <button type="button" onClick={() => setSuccessMessage("")}
          className="ml-auto shrink-0 rounded-lg p-1 hover:bg-green-100" aria-label="Close message">
          <X size={18} />
        </button>
      </div>
    );
  }

  function renderField(
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      errorKey?: string;
    }
  ) {
    const required = options?.required !== false;
    const errorKey = options?.errorKey;
    const error = errorKey ? fieldErrors[errorKey] : undefined;
    return (
      <label className="block scroll-mt-28"
        ref={(element) => { if (errorKey) registerErrorRef(errorKey, element); }}>
        <span className="mb-2 block text-sm font-semibold text-[#172033]">
          {label}
          {required && <span className="ml-1 text-[#F58220]">*</span>}
        </span>
        <input id={errorKey} type={options?.type || "text"} value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={options?.placeholder} required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${errorKey}-error` : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:ring-4 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
          }`} />
        {error && (
          <p id={`${errorKey}-error`}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={15} /> {error}
          </p>
        )}
      </label>
    );
  }

  function renderSelect(
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
    required = true,
    errorKey?: string
  ) {
    const error = errorKey ? fieldErrors[errorKey] : undefined;
    return (
      <label className="block scroll-mt-28"
        ref={(element) => { if (errorKey) registerErrorRef(errorKey, element); }}>
        <span className="mb-2 block text-sm font-semibold text-[#172033]">
          {label}
          {required && <span className="ml-1 text-[#F58220]">*</span>}
        </span>
        <div className="relative">
          <select id={errorKey} value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${errorKey}-error` : undefined}
            className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-[#172033] outline-none transition focus:ring-4 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
            }`}>
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <ChevronDown size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {error && (
          <p id={`${errorKey}-error`}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={15} /> {error}
          </p>
        )}
      </label>
    );
  }

  /* ================================================================== */
  /* Landing                                                             */
  /* ================================================================== */

  function renderLanding() {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-[#252B68]">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#FFE900]/10" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#F58220]/10" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
              <div className="max-w-3xl text-white">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
                  <GraduationCap size={17} className="text-[#FFE900]" />
                  Admissions
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Begin your child's
                  <span className="block text-[#FFE900]">
                    Mount View journey.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                  Apply online for admission to Mount View International
                  Primary School & Early Years Centre. We will email you
                  your application number and access token, which you will
                  use to return to your application at any time.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button type="button"
                    onClick={() => {
                      setStartEmail(""); setEmailModalError("");
                      setShowEmailModal(true);
                    }}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFE900] px-6 py-3.5 font-bold text-[#252B68] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Starting..." : "Start Online Application"}
                    <ArrowRight size={18} />
                  </button>
                  <button type="button"
                    onClick={continueExistingApplication}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
                    Continue / Track Application
                    <Search size={18} />
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap gap-5 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={17} className="text-[#FFE900]" />
                    Credentials by email
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Save size={17} className="text-[#FFE900]" />
                    Save progress
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Search size={17} className="text-[#FFE900]" />
                    Track application
                  </span>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252B68] text-[#FFE900]">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#172033]">Simple & Secure</h2>
                    <p className="text-sm text-slate-500">No parent account required</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    "Enter your email address",
                    "We email your application number and access token",
                    "Complete the application online",
                    "Upload the required documents",
                    "Submit and track your application",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFE900] text-xs font-black text-[#252B68]">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#252B68]" />
                    <p>Your application is protected by a private access token. Keep your email, application number, and token safe.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-[#F58220]">How it works</p>
              <h2 className="mt-3 text-3xl font-black text-[#252B68] sm:text-4xl">A clear admissions process</h2>
              <p className="mt-4 text-slate-600">We have designed the application process to make it easier for families to provide the information needed by our admissions team.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: FileText, title: "Apply", text: "Complete the student and parent information." },
                { icon: Upload, title: "Provide Documents", text: "Upload the required admission documents." },
                { icon: ClipboardCheck, title: "Assessment", text: "Our admissions team will communicate assessment arrangements." },
                { icon: HeartHandshake, title: "Admission Decision", text: "The school reviews the application and communicates the outcome." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252B68] text-[#FFE900]">
                      <Icon size={23} />
                    </div>
                    <h3 className="mt-5 font-bold text-[#172033]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
              <div className="grid gap-8 md:grid-cols-3">
                <InfoBlock icon={<Info size={25} />} title="Before you apply">
                  Have your child's personal information, parent details and previous school information available.
                </InfoBlock>
                <InfoBlock icon={<FileCheck2 size={25} />} title="Prepare documents">
                  Prepare clear copies of the required admission documents and photographs.
                </InfoBlock>
                <InfoBlock icon={<Mail size={25} />} title="Save your email">
                  We will send your application number and access token to the email you provide. Keep that email safe.
                </InfoBlock>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#252B68] py-14 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
            <div>
              <h2 className="text-2xl font-black">Ready to apply?</h2>
              <p className="mt-2 text-white/70">Start your Mount View admission application online.</p>
            </div>
            <button type="button"
              onClick={() => {
                setStartEmail(""); setEmailModalError("");
                setShowEmailModal(true);
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFE900] px-6 py-3 font-bold text-[#252B68] hover:bg-white disabled:opacity-50">
              Start Application
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  function renderApplicationHeader() {
    return (
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#252B68]">
                <Image src="/logo.jpg"
                  alt="Mount View International Primary School"
                  fill className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">Admissions</p>
                <h1 className="font-black text-[#252B68]">Mount View International</h1>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">Application Number</p>
              <p className="mt-1 font-black text-[#252B68]">
                {applicationNumber || "Generating..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProgress() {
    return (
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex min-w-[720px] items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = currentStep === step.number;
            const completed = currentStep > step.number;
            return (
              <div key={step.number} className="flex flex-1 items-center">
                <button type="button" disabled={!completed}
                  onClick={() => {
                    if (completed) {
                      clearFieldErrors();
                      setCurrentStep(step.number);
                      requestAnimationFrame(() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      );
                    }
                  }}
                  className="flex items-center gap-3 disabled:cursor-default">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                    completed
                      ? "border-[#252B68] bg-[#252B68] text-white"
                      : active
                      ? "border-[#F58220] bg-[#F58220] text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}>
                    {completed ? <Check size={18} /> : <Icon size={17} />}
                  </span>
                  <span className={`hidden text-sm font-bold lg:block ${
                    active || completed ? "text-[#252B68]" : "text-slate-400"
                  }`}>
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`mx-3 h-px flex-1 ${
                    completed ? "bg-[#252B68]" : "bg-slate-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /* Step 1                                                              */
  /* ================================================================== */

  function renderStudentDetails() {
    const photoError = fieldErrors.student_photo;
    const addressError = fieldErrors["student.physical_address"];
    const showMountViewEmail =
      Number(application.student.existing_mount_view_children_count || 0) >= 1;
    const photoOnFile = existingPhoto || photoUploaded;

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#252B68]">Student Details</h2>
          <p className="mt-2 text-sm text-slate-500">
            Please provide the student's information exactly as it appears on official documents.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {renderField("Legal First Name", application.student.legal_first_name,
            (v) => updateStudent("legal_first_name", v),
            { placeholder: "First name", errorKey: "student.legal_first_name" })}
          {renderField("Middle Name", application.student.middle_name,
            (v) => updateStudent("middle_name", v),
            { required: false, placeholder: "Middle name" })}
          {renderField("Legal Surname", application.student.legal_surname,
            (v) => updateStudent("legal_surname", v),
            { placeholder: "Surname", errorKey: "student.legal_surname" })}
          {renderField("Date of Birth", application.student.date_of_birth,
            (v) => updateStudent("date_of_birth", v),
            { type: "date", errorKey: "student.date_of_birth" })}
          {renderSelect("Gender", application.student.gender,
            (v) => updateStudent("gender", v),
            ["Male", "Female", "Prefer not to say"], true, "student.gender")}
          {renderSelect("Blood Group", application.student.blood_group,
            (v) => updateStudent("blood_group", v),
            ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"], false)}
          {renderSelect("Class Applied For", application.student.class_applied_for,
            (v) => updateStudent("class_applied_for", v),
            classOptions, true, "student.class_applied_for")}
          {renderField("First Language", application.student.first_language,
            (v) => updateStudent("first_language", v),
            { required: false, placeholder: "e.g. Chichewa" })}
          {renderField("Nationality", application.student.nationality,
            (v) => updateStudent("nationality", v),
            { placeholder: "Nationality" })}
          {renderField("Religion", application.student.religion,
            (v) => updateStudent("religion", v),
            { required: false, placeholder: "Religion" })}
          {renderField("Weight", application.student.weight,
            (v) => updateStudent("weight", v),
            { required: false, placeholder: "Weight" })}
          {renderField("Height", application.student.height,
            (v) => updateStudent("height", v),
            { required: false, placeholder: "Height" })}
          {renderField("Emergency Contact", application.student.emergency_contact,
            (v) => updateStudent("emergency_contact", v),
            { required: false, placeholder: "Emergency phone number" })}
          {renderField("Number of Family Members",
            application.student.family_members_count,
            (v) => updateStudent("family_members_count", v),
            { type: "number", required: false })}
          {renderField("Number of Children Already Attending Mount View",
            application.student.existing_mount_view_children_count,
            handleChildrenCountChange,
            { type: "number", required: false })}
          {showMountViewEmail && renderField(
            "Email Associated with Mount View",
            application.student.email_with_mount_view,
            (v) => updateStudent("email_with_mount_view", v),
            { type: "email",
              placeholder: "Email registered on your Mount View parent account",
              errorKey: "student.email_with_mount_view" }
          )}
          {renderSelect("Student Lives With", application.student.lives_with,
            (v) => updateStudent("lives_with", v),
            ["Both Parents", "Mother", "Father", "Guardian", "Other"], false)}
        </div>

        {/* Siblings at Mount View */}
        {showMountViewEmail && (
          <div className="rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-[#252B68]">
                Siblings at Mount View
              </h3>
              <button type="button" onClick={addSibling}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#252B68] bg-white px-3 py-1.5 text-xs font-bold text-[#252B68] hover:bg-[#252B68]/5">
                Add sibling
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-600">
              Please enter the name of each child already attending Mount View.
            </p>
            {application.student.siblings_at_mount_view.length === 0 ? (
              <p className="text-sm text-slate-500">
                No siblings added. Click "Add sibling" to add one.
              </p>
            ) : (
              <div className="space-y-2">
                {application.student.siblings_at_mount_view.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" value={name}
                      onChange={(e) => updateSibling(index, e.target.value)}
                      placeholder={`Sibling ${index + 1} full name`}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                    <button type="button" onClick={() => removeSibling(index)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove sibling">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <label className="block scroll-mt-28"
          ref={(element) => registerErrorRef("student.physical_address", element)}>
          <span className="mb-2 block text-sm font-semibold text-[#172033]">
            Physical Address
            <span className="ml-1 text-[#F58220]">*</span>
          </span>
          <textarea value={application.student.physical_address}
            onChange={(e) => updateStudent("physical_address", e.target.value)}
            rows={3} required
            aria-invalid={Boolean(addressError)}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
              addressError
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "border-slate-200 focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
            }`}
            placeholder="Student's current physical address" />
          {addressError && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle size={15} /> {addressError}
            </p>
          )}
        </label>

        {/* Medical Information */}
        <div className="rounded-2xl border border-[#252B68]/10 bg-slate-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope size={18} className="text-[#252B68]" />
            <h3 className="font-black text-[#252B68]">Medical Information</h3>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Please provide any medical information that the school should be aware of.
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Medical condition(s) the school should be aware of
              </span>
              <textarea value={application.student.medical_conditions}
                onChange={(e) => updateStudent("medical_conditions", e.target.value)}
                rows={3}
                placeholder="e.g. Asthma, diabetes, epilepsy — or leave blank if none"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Allergies
              </span>
              <textarea value={application.student.allergies}
                onChange={(e) => updateStudent("allergies", e.target.value)}
                rows={2}
                placeholder="e.g. Peanuts, penicillin — or leave blank if none"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Learning needs (if any — please specify)
              </span>
              <textarea value={application.student.learning_needs}
                onChange={(e) => updateStudent("learning_needs", e.target.value)}
                rows={3}
                placeholder="e.g. Dyslexia support, speech therapy, gifted programme"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Family Doctor
                </span>
                <input type="text" value={application.student.family_doctor_name}
                  onChange={(e) => updateStudent("family_doctor_name", e.target.value)}
                  placeholder="Doctor's full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Doctor's Phone Number
                </span>
                <input type="tel" value={application.student.family_doctor_phone}
                  onChange={(e) => updateStudent("family_doctor_phone", e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
              </label>
            </div>
          </div>
        </div>

        <div className={`scroll-mt-28 rounded-2xl border border-dashed p-5 ${
          photoError
            ? "border-red-400 bg-red-50"
            : "border-slate-300 bg-slate-50"
        }`} ref={(element) => registerErrorRef("student_photo", element)}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Student preview"
                  className="h-full w-full object-cover" />
              ) : photoOnFile ? (
                <CheckCircle2 size={35} className="text-green-500" />
              ) : (
                <UserRound size={35} className="text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#252B68]">
                Student Photograph
                <span className="ml-1 text-[#F58220]">*</span>
              </h3>
              {photoOnFile && !studentPhoto ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <CheckCircle2 size={15} />
                  A photograph is already on file. Choose a new file only if you want to replace it.
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Upload a clear recent passport-style photograph.
                </p>
              )}
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#252B68] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c2156]">
                <Upload size={17} />
                {studentPhoto
                  ? "Change Photograph"
                  : photoOnFile
                  ? "Replace Photograph"
                  : "Choose Photograph"}
                <input type="file" accept="image/jpeg,image/png,image/webp"
                  className="hidden" onChange={handlePhotoChange} />
              </label>
              {studentPhoto && (
                <p className="mt-2 text-xs text-slate-500">
                  {studentPhoto.name}
                  {photoUploaded && (
                    <span className="ml-2 font-semibold text-green-600">· uploaded</span>
                  )}
                </p>
              )}
              {photoError && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <AlertCircle size={15} /> {photoError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /* Step 2                                                              */
  /* ================================================================== */

  function renderParents() {
    const parentsError = fieldErrors.parents;
    return (
      <div className="space-y-8 scroll-mt-28"
        ref={(element) => registerErrorRef("parents", element)}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black text-[#252B68]">Parents & Guardians</h2>
            <p className="mt-2 text-sm text-slate-500">
              Provide details for the people responsible for the student.
            </p>
            {parentsError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
                <AlertCircle size={15} /> {parentsError}
              </p>
            )}
          </div>
          <button type="button" onClick={addParent}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#252B68] px-4 py-2.5 text-sm font-bold text-[#252B68] hover:bg-[#252B68] hover:text-white">
            <Users size={17} /> Add Parent / Guardian
          </button>
        </div>

        <div className="space-y-6">
          {application.parents.map((parent, index) => (
            <div key={index}
              className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#252B68]">
                    Parent / Guardian {index + 1}
                  </h3>
                  {parent.is_primary && (
                    <p className="mt-1 text-xs font-semibold text-[#F58220]">
                      Primary contact
                    </p>
                  )}
                </div>
                {application.parents.length > 1 && (
                  <button type="button" onClick={() => removeParent(index)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove parent">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {renderField("Full Name", parent.full_name,
                  (v) => updateParent(index, "full_name", v),
                  { errorKey: `parent.${index}.full_name` })}
                {renderField("Relationship to Student", parent.relationship,
                  (v) => updateParent(index, "relationship", v),
                  { placeholder: "e.g. Mother, Father, Guardian",
                    errorKey: `parent.${index}.relationship` })}
                {renderField("Phone", parent.phone,
                  (v) => updateParent(index, "phone", v),
                  { type: "tel", placeholder: "Phone number",
                    errorKey: `parent.${index}.phone` })}
                {renderField("Email", parent.email,
                  (v) => updateParent(index, "email", v),
                  { type: "email", required: false, placeholder: "Email address" })}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-4 text-sm font-bold text-[#252B68]">
                  Employment Particulars
                </h4>
                <div className="grid gap-5 sm:grid-cols-2">
                  {renderField("Occupation", parent.occupation,
                    (v) => updateParent(index, "occupation", v),
                    { required: false, placeholder: "e.g. Teacher" })}
                  {renderField("Position / Title", parent.position_title,
                    (v) => updateParent(index, "position_title", v),
                    { required: false, placeholder: "e.g. Senior Accountant" })}
                  {renderField("Employer", parent.employer,
                    (v) => updateParent(index, "employer", v),
                    { required: false, placeholder: "Company or business name" })}
                  {renderField("Place of Work / Business Phone",
                    parent.work_phone,
                    (v) => updateParent(index, "work_phone", v),
                    { type: "tel", required: false,
                      placeholder: "Work phone number" })}
                </div>
                <div className="mt-5">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Place of Work / Business Address
                    </span>
                    <textarea value={parent.work_address}
                      onChange={(e) => updateParent(index, "work_address", e.target.value)}
                      rows={2}
                      placeholder="Physical or postal address of workplace"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-start gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox"
                      checked={parent.employer_pays_fees}
                      onChange={(e) =>
                        updateParent(index, "employer_pays_fees", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                    Employer will pay the school fees
                  </label>
                </div>

                {parent.employer_pays_fees && (
                  <div className="mt-4 rounded-xl border border-[#F58220]/30 bg-[#F58220]/5 p-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Percentage the employer will pay
                        <span className="ml-1 text-[#F58220]">*</span>
                      </span>
                      <div className="relative">
                        <input type="number" min={1} max={100}
                          value={parent.employer_payment_percentage}
                          onChange={(e) =>
                            updateParent(index,
                              "employer_payment_percentage",
                              e.target.value)}
                          placeholder="e.g. 50"
                          className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-4 ${
                            fieldErrors[`parent.${index}.employer_payment_percentage`]
                              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                              : "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
                          }`} />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                          %
                        </span>
                      </div>
                      {fieldErrors[`parent.${index}.employer_payment_percentage`] && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <AlertCircle size={13} />
                          {fieldErrors[`parent.${index}.employer_payment_percentage`]}
                        </p>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#172033]">
                    Physical Address
                  </span>
                  <textarea value={parent.physical_address}
                    onChange={(e) => updateParent(index, "physical_address", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#172033]">
                    Postal Address
                  </span>
                  <textarea value={parent.postal_address}
                    onChange={(e) => updateParent(index, "postal_address", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-5">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={parent.emergency_contact}
                    onChange={(e) =>
                      updateParent(index, "emergency_contact", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                  Emergency contact
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={parent.is_primary}
                    onChange={(e) => makeParentPrimary(index, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#252B68]" />
                  Primary contact
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /* Step 3                                                              */
  /* ================================================================== */

  function renderPreviousSchool() {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#252B68]">
            Previous School Information
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Provide information about the student's previous school, where applicable.
          </p>
        </div>

        <div className="rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-5">
          <div className="flex gap-3">
            <Info size={19} className="mt-0.5 shrink-0 text-[#252B68]" />
            <p className="text-sm leading-6 text-slate-600">
              If the student has not attended another school, you may leave the previous school fields blank.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {renderField("Previous School Name", application.previous_school.name,
            (v) => updatePreviousSchool("name", v),
            { required: false, placeholder: "Name of previous school" })}
          {renderField("Country", application.previous_school.country,
            (v) => updatePreviousSchool("country", v),
            { required: false, placeholder: "e.g. Malawi" })}
          {renderField("Previous Class", application.previous_school.previous_class,
            (v) => updatePreviousSchool("previous_class", v),
            { required: false, placeholder: "Class previously attended" })}
          {renderField("Instructional Language",
            application.previous_school.instructional_language,
            (v) => updatePreviousSchool("instructional_language", v),
            { required: false, placeholder: "e.g. English" })}
          {renderField("Last Year Attended", application.previous_school.last_year,
            (v) => updatePreviousSchool("last_year", v),
            { required: false, placeholder: "e.g. 2026" })}
          {renderField("School Contact", application.previous_school.contact,
            (v) => updatePreviousSchool("contact", v),
            { required: false, placeholder: "Telephone or email" })}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#172033]">
            Previous School Address
          </span>
          <textarea value={application.previous_school.address}
            onChange={(e) => updatePreviousSchool("address", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#172033]">
            Reason for Leaving
          </span>
          <textarea value={application.previous_school.reason_for_leaving}
            onChange={(e) => updatePreviousSchool("reason_for_leaving", e.target.value)}
            rows={4}
            placeholder="Please provide the reason, if applicable."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
        </label>
      </div>
    );
  }

  /* ================================================================== */
  /* Step 4                                                              */
  /* ================================================================== */

  function renderDocuments() {
    const requiredDocs = documents.filter((d) => d.required);
    const optionalDocs = documents.filter((d) => !d.required);
    const requiredUploaded = requiredDocs.filter(
      (d) => d.file || uploadedDocuments[d.type]
    ).length;
    const optionalUploaded = optionalDocs.filter(
      (d) => d.file || uploadedDocuments[d.type]
    ).length;

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#252B68]">Required Documents</h2>
          <p className="mt-2 text-sm text-slate-500">
            Upload clear copies of the documents required for admission. Required
            documents must be uploaded before you can continue. Optional documents
            can be supplied later if needed.
          </p>
        </div>

        <div className="rounded-2xl border border-[#F58220]/20 bg-[#F58220]/5 p-5">
          <div className="flex gap-3">
            <Info size={20} className="mt-0.5 shrink-0 text-[#F58220]" />
            <div>
              <p className="font-bold text-[#172033]">
                Document checklist ({requiredUploaded} of {requiredDocs.length}{" "}
                required uploaded
                {optionalDocs.length > 0 &&
                  ` · ${optionalUploaded} of ${optionalDocs.length} optional uploaded`}
                )
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The admissions office will verify uploaded documents. Physical
                copies may also be requested.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc, index) => {
            const error = fieldErrors[`document.${index}`];
            const onServer = uploadedDocuments[doc.type];
            return (
              <div key={doc.type}
                ref={(element) =>
                  registerErrorRef(`document.${index}`, element)}
                className={`scroll-mt-28 rounded-2xl border bg-white p-5 ${
                  error ? "border-red-400" : "border-slate-200"
                }`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#252B68]">
                      <FileText size={19} />
                    </div>
                    <div>
                      <p className="font-bold text-[#172033]">
                        {documentLabels[doc.type] || doc.type}
                        {doc.required ? (
                          <span className="ml-1 text-[#F58220]">*</span>
                        ) : (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Optional
                          </span>
                        )}
                      </p>
                      {onServer && !doc.file ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                          <CheckCircle2 size={13} />
                          Already on file. Choose a new file only to replace it.
                        </p>
                      ) : (
                        <>
                          <p className="mt-1 text-xs text-slate-500">
                            {doc.hint ? doc.hint : "PDF, JPG, PNG or WEBP · Max 5 MB"}
                          </p>
                          {doc.required && doc.hint && (
                            <p className="mt-1 text-xs text-slate-500">
                              PDF, JPG, PNG or WEBP · Max 5 MB
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#252B68] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1c2156]">
                      <Upload size={17} />
                      {doc.file ? "Change File" : onServer ? "Replace File" : "Choose File"}
                      <input type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => handleDocumentChange(index, event)} />
                    </label>
                    {doc.file && (
                      <button type="button" onClick={() => clearDocument(index)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                        aria-label="Remove file">
                        <X size={15} /> Remove
                      </button>
                    )}
                  </div>
                </div>
                {doc.file && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 size={17} />
                    <span className="truncate">{doc.file.name}</span>
                    {uploadedDocuments[doc.type] && (
                      <span className="ml-auto text-xs font-semibold">· uploaded</span>
                    )}
                  </div>
                )}
                {error && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
                    <AlertCircle size={15} /> {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /* Step 5                                                              */
  /* ================================================================== */

  function renderReview() {
    const studentName = [
      application.student.legal_first_name,
      application.student.middle_name,
      application.student.legal_surname,
    ].filter(Boolean).join(" ");
    const termsError = fieldErrors.terms;

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#252B68]">Review & Submit</h2>
          <p className="mt-2 text-sm text-slate-500">
            Please carefully review the information before submitting your application.
          </p>
        </div>

        <div className="rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-5">
          <div className="flex gap-3">
            <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#252B68]" />
            <div>
              <p className="font-bold text-[#252B68]">Application reference</p>
              <p className="mt-1 text-sm text-slate-600">
                Your application number is <strong>{applicationNumber}</strong>.
                Keep this number and your access token safe.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ReviewCard title="Student" items={[
            ["Name", studentName],
            ["Date of Birth", application.student.date_of_birth],
            ["Gender", application.student.gender],
            ["Class", application.student.class_applied_for],
            ["Email with Mount View", application.student.email_with_mount_view || "—"],
            [
              "Siblings at Mount View",
              application.student.siblings_at_mount_view
                .filter((n) => n.trim() !== "")
                .join(", ") || "None",
            ],
          ]} />

          <ReviewCard title="Medical Information" items={[
            ["Medical Conditions", application.student.medical_conditions || "None"],
            ["Allergies", application.student.allergies || "None"],
            ["Learning Needs", application.student.learning_needs || "None"],
            ["Family Doctor", application.student.family_doctor_name || "—"],
            ["Doctor's Phone", application.student.family_doctor_phone || "—"],
          ]} />

          <ReviewCard title="Primary Parent / Guardian" items={[
            ["Name", application.parents[0]?.full_name || ""],
            ["Relationship", application.parents[0]?.relationship || ""],
            ["Phone", application.parents[0]?.phone || ""],
            ["Email", application.parents[0]?.email || "Not provided"],
            ["Occupation", application.parents[0]?.occupation || "—"],
            ["Position", application.parents[0]?.position_title || "—"],
            ["Employer", application.parents[0]?.employer || "—"],
            [
              "Employer Pays Fees",
              application.parents[0]?.employer_pays_fees
                ? `${application.parents[0].employer_payment_percentage || "—"}%`
                : "No",
            ],
          ]} />

          <ReviewCard title="Previous School" items={[
            ["School", application.previous_school.name || "Not provided"],
            ["Country", application.previous_school.country || "Not provided"],
            ["Previous Class", application.previous_school.previous_class || "Not provided"],
            [
              "Instructional Language",
              application.previous_school.instructional_language || "Not provided",
            ],
            ["Last Year", application.previous_school.last_year || "Not provided"],
          ]} />

          <ReviewCard title="Documents" items={documents.map((document) => {
            const onServer = uploadedDocuments[document.type];
            return [
              document.required
                ? documentLabels[document.type] || document.type
                : `${documentLabels[document.type] || document.type} (optional)`,
              document.file || onServer
                ? "Uploaded"
                : document.required
                ? "Not selected"
                : "Not provided",
            ];
          })} />
        </div>

        <div ref={(element) => registerErrorRef("terms", element)}
          className={`scroll-mt-28 rounded-3xl border bg-white p-6 ${
            termsError ? "border-red-400" : "border-slate-200"
          }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-[#252B68]">
                Mount View Terms and Conditions
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                You must read and accept the Mount View terms and conditions
                before you can submit this application.
              </p>
            </div>
            <button type="button" onClick={() => setShowTermsModal(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156]">
              <FileText size={17} />
              {termsViewed ? "View Terms Again" : "Read Terms & Conditions"}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <label className={`flex items-start gap-3 ${
              !termsViewed ? "cursor-not-allowed opacity-60" : ""
            }`}>
              <input type="checkbox" checked={termsAccepted}
                disabled={!termsViewed}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  if (event.target.checked) {
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.terms;
                      return next;
                    });
                  }
                }}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-[#252B68] disabled:cursor-not-allowed" />
              <span className="text-sm leading-6 text-slate-600">
                {TERMS_AGREEMENT_STATEMENT}
              </span>
            </label>
            {!termsViewed && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Info size={13} />
                Tick this box to confirm after you have read the terms.
              </p>
            )}
          </div>

          {termsError && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle size={15} /> {termsError}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm leading-6 text-slate-600">
            Once submitted, your application will enter the school's admissions
            process. The admissions team may contact you if additional information
            or documents are required.
          </p>
        </div>
      </div>
    );
  }

  function renderApplication() {
    return (
      <main className="min-h-screen bg-slate-50">
        {renderApplicationHeader()}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {renderError()}
          {renderSuccess()}
          {applicationNumber && (
            <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <LockKeyhole size={19} className="mt-0.5 shrink-0 text-[#252B68]" />
                  <div>
                    <p className="text-sm font-bold text-[#252B68]">
                      Keep your application access details
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Application: <strong>{applicationNumber}</strong>
                    </p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => setShowToken((current) => !current)}
                  className="text-left text-sm font-bold text-[#252B68] underline">
                  {showToken ? "Hide access token" : "Show access token"}
                </button>
              </div>
              {showToken && (
                <div className="mt-3 rounded-xl bg-white p-3">
                  <p className="break-all font-mono text-xs text-slate-700">
                    {accessToken}
                  </p>
                </div>
              )}
            </div>
          )}

          {renderProgress()}

          <form onSubmit={submitApplication}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8 lg:p-10"
            noValidate>
            {currentStep === 1 && renderStudentDetails()}
            {currentStep === 2 && renderParents()}
            {currentStep === 3 && renderPreviousSchool()}
            {currentStep === 4 && renderDocuments()}
            {currentStep === 5 && renderReview()}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {currentStep > 1 && (
                  <button type="button" onClick={previousStep}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    <ArrowLeft size={17} /> Back
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={saveApplication}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#252B68] px-5 py-3 text-sm font-bold text-[#252B68] hover:bg-[#252B68]/5 disabled:opacity-50">
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Progress"}
                </button>
                {currentStep < 5 ? (
                  <button type="button" onClick={nextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-6 py-3 text-sm font-bold text-white hover:bg-[#1c2156]">
                    Continue <ArrowRight size={17} />
                  </button>
                ) : (
                  <button type="submit"
                    disabled={submitting || !termsAccepted || !termsViewed}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-6 py-3 text-sm font-bold text-white hover:bg-[#dd6e13] disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? "Submitting..." : "Submit Application"}
                    <Check size={17} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    );
  }

  function renderTracking() {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="bg-[#252B68] py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <button type="button"
              onClick={() => { setMode("landing"); clearMessages(); }}
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
              <ArrowLeft size={17} /> Back to Admissions
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFE900] text-[#252B68]">
              <Search size={29} />
            </div>
            <h1 className="mt-6 text-3xl font-black sm:text-4xl">Track your application</h1>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Enter your application number and private access token to retrieve
              your admission application.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
          {renderError()}
          {renderSuccess()}

          <form onSubmit={trackApplication}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
            noValidate>
            <div className="space-y-5">
              {renderField("Application Number", trackNumber, setTrackNumber,
                { placeholder: "e.g. MVIPS-2027-00001" })}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#172033]">
                  Access Token
                  <span className="ml-1 text-[#F58220]">*</span>
                </span>
                <input type={showToken ? "text" : "password"}
                  value={trackToken}
                  onChange={(event) => setTrackToken(event.target.value)}
                  placeholder="Enter your private access token"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                <button type="button"
                  onClick={() => setShowToken((current) => !current)}
                  className="mt-2 text-xs font-bold text-[#252B68] underline">
                  {showToken ? "Hide token" : "Show token"}
                </button>
              </label>
              <button type="submit" disabled={tracking}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3.5 font-bold text-white hover:bg-[#1c2156] disabled:cursor-not-allowed disabled:opacity-50">
                <Search size={18} />
                {tracking ? "Retrieving..." : "Track Application"}
              </button>
            </div>
          </form>

          <button type="button"
            onClick={() => {
              setResendEmail(""); setResendError("");
              setResendSuccess(""); setShowResendModal(true);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#252B68] hover:bg-slate-50">
            <Mail size={16} />
            Lost your details? Resend by email
          </button>

          <div className="mt-6 rounded-2xl bg-[#252B68]/5 p-5">
            <div className="flex gap-3">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#252B68]" />
              <p className="text-sm leading-6 text-slate-600">
                Your access token is private. Do not share it publicly or with
                anyone who does not need access to your application.
              </p>
            </div>
          </div>

          <button type="button" onClick={() => setMode("landing")}
            className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-bold text-[#252B68]">
            <ArrowLeft size={16} /> Return to Admissions
          </button>
        </div>
      </main>
    );
  }

  function renderStatus() {
    const api = applicationStatus || {};
    const student = application.student;
    const parents = application.parents;
    const previous = application.previous_school;
    const uploadedDocs = Array.isArray(api.documents) ? api.documents : [];
    const assessments = Array.isArray(api.assessments) ? api.assessments : [];
    const decisions = Array.isArray(api.decisions) ? api.decisions : [];
    const submittedAt = api.submitted_at || api.submittedAt || null;
    const statusLabel = String(api.status || "submitted")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const studentName = [
      student.legal_first_name, student.middle_name, student.legal_surname,
    ].filter(Boolean).join(" ") || "—";
    const scheduledAssessment = assessments.find((a: any) => !a.result);
    const completedAssessment = assessments.find((a: any) => Boolean(a.result));
    const primaryAssessment = completedAssessment || scheduledAssessment;

    return (
      <main className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-100 bg-white print:hidden">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#252B68]">
                  <Image src="/logo.jpg" alt="Mount View" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">Admissions</p>
                  <h1 className="font-black text-[#252B68]">Mount View International</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Printer size={16} />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
                <button type="button"
                  onClick={() => {
                    clearMessages(); setMode("landing");
                    setApplicationStatus(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6 rounded-3xl border border-green-100 bg-white p-6 shadow-sm print:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <CheckCircle2 size={26} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Application Status
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#252B68]">
                  {statusLabel}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your application was submitted
                  {submittedAt ? ` on ${formatDateTimeDisplay(submittedAt)}` : ""}.
                  Below is a copy of everything you provided. It can no longer
                  be edited. Contact the admissions office if you need to make
                  a change.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Application Number
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-[#252B68]">
                      {applicationNumber}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Class Applied For
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#252B68]">
                      {student.class_applied_for || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {scheduledAssessment && !completedAssessment && (
            <div className="mb-6 rounded-3xl border-2 border-[#F58220]/30 bg-[#F58220]/5 p-6 shadow-sm print:break-inside-avoid">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F58220] text-white">
                  <Calendar size={26} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                    Upcoming Assessment
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#252B68]">
                    {scheduledAssessment.assessment_date
                      ? formatDateDisplay(scheduledAssessment.assessment_date)
                      : "Date to be confirmed"}
                  </h2>
                  {scheduledAssessment.assessment_time && (
                    <p className="mt-1 text-lg font-bold text-slate-700">
                      at {scheduledAssessment.assessment_time}
                    </p>
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Type</p>
                      <p className="mt-1 text-sm font-bold text-[#252B68]">
                        {scheduledAssessment.assessment_type || "Assessment"}
                      </p>
                    </div>
                    {scheduledAssessment.location && (
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                        <p className="mt-1 text-sm font-bold text-[#252B68]">
                          {scheduledAssessment.location}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-600">
                    <Info size={16} className="mt-1 shrink-0 text-[#F58220]" />
                    <span>
                      Please arrive at least 15 minutes early. Bring the student's
                      original documents. If you cannot attend, contact the
                      admissions office as soon as possible to reschedule.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <ReadOnlySection title="Student Information">
            <ReadOnlyGrid>
              <ReadOnlyField label="Full Name" value={studentName} />
              <ReadOnlyField label="Date of Birth" value={formatDateDisplay(student.date_of_birth)} />
              <ReadOnlyField label="Gender" value={student.gender} />
              <ReadOnlyField label="Blood Group" value={student.blood_group} />
              <ReadOnlyField label="Nationality" value={student.nationality} />
              <ReadOnlyField label="First Language" value={student.first_language} />
              <ReadOnlyField label="Religion" value={student.religion} />
              <ReadOnlyField label="Class Applied For" value={student.class_applied_for} />
              <ReadOnlyField label="Weight" value={student.weight} />
              <ReadOnlyField label="Height" value={student.height} />
              <ReadOnlyField label="Emergency Contact" value={student.emergency_contact} />
              <ReadOnlyField label="Family Members" value={student.family_members_count} />
              <ReadOnlyField label="Lives With" value={student.lives_with} />
              <ReadOnlyField label="Children at Mount View" value={student.existing_mount_view_children_count} />
              <ReadOnlyField
                label="Siblings at Mount View"
                value={
                  application.student.siblings_at_mount_view
                    .filter((n) => n.trim() !== "")
                    .join(", ") || "None"
                }
              />
              {student.email_with_mount_view && (
                <ReadOnlyField label="Email with Mount View" value={student.email_with_mount_view} />
              )}
            </ReadOnlyGrid>
            <div className="mt-5">
              <ReadOnlyField label="Physical Address" value={student.physical_address} block />
            </div>
          </ReadOnlySection>

          <ReadOnlySection title="Medical Information">
            <ReadOnlyGrid>
              <ReadOnlyField label="Medical Conditions" value={student.medical_conditions || "None"} />
              <ReadOnlyField label="Allergies" value={student.allergies || "None"} />
              <ReadOnlyField label="Learning Needs" value={student.learning_needs || "None"} />
              <ReadOnlyField label="Family Doctor" value={student.family_doctor_name || "—"} />
              <ReadOnlyField label="Doctor's Phone" value={student.family_doctor_phone || "—"} />
            </ReadOnlyGrid>
          </ReadOnlySection>

          <ReadOnlySection title="Parents & Guardians">
            {parents.length === 0 ? (
              <p className="text-sm text-slate-500">No parents recorded.</p>
            ) : (
              <div className="space-y-4">
                {parents.map((parent, index) => (
                  <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <p className="font-bold text-[#172033]">{parent.full_name || "—"}</p>
                      {parent.is_primary && (
                        <span className="rounded-full bg-[#F58220]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F58220]">Primary</span>
                      )}
                      {parent.emergency_contact && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">Emergency</span>
                      )}
                    </div>
                    <ReadOnlyGrid>
                      <ReadOnlyField label="Relationship" value={parent.relationship} />
                      <ReadOnlyField label="Phone" value={parent.phone} />
                      <ReadOnlyField label="Email" value={parent.email} />
                      <ReadOnlyField label="Occupation" value={parent.occupation} />
                      <ReadOnlyField label="Position" value={parent.position_title} />
                      <ReadOnlyField label="Employer" value={parent.employer} />
                      <ReadOnlyField label="Work Phone" value={parent.work_phone} />
                      <ReadOnlyField
                        label="Employer Pays Fees"
                        value={
                          parent.employer_pays_fees
                            ? `Yes · ${parent.employer_payment_percentage || "—"}%`
                            : "No"
                        }
                      />
                    </ReadOnlyGrid>
                    {parent.work_address && (
                      <div className="mt-3">
                        <ReadOnlyField label="Work Address" value={parent.work_address} block />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ReadOnlySection>

          <ReadOnlySection title="Previous School">
            {!previous.name && !previous.address && !previous.previous_class ? (
              <p className="text-sm text-slate-500">No previous school recorded.</p>
            ) : (
              <>
                <ReadOnlyGrid>
                  <ReadOnlyField label="School Name" value={previous.name} />
                  <ReadOnlyField label="Country" value={previous.country} />
                  <ReadOnlyField label="Previous Class" value={previous.previous_class} />
                  <ReadOnlyField label="Instructional Language" value={previous.instructional_language} />
                  <ReadOnlyField label="Last Year" value={previous.last_year} />
                  <ReadOnlyField label="Contact" value={previous.contact} />
                </ReadOnlyGrid>
                {previous.address && (
                  <div className="mt-3">
                    <ReadOnlyField label="School Address" value={previous.address} block />
                  </div>
                )}
              </>
            )}
          </ReadOnlySection>

          <ReadOnlySection title="Uploaded Documents">
            {uploadedDocs.length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {uploadedDocs.map((doc: any, index: number) => {
                  const label = documentLabels[doc.document_type] || doc.document_type;
                  const status = String(doc.verification_status || "pending");
                  const styles =
                    {
                      pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
                      verified: { bg: "bg-green-50", text: "text-green-700", label: "Verified" },
                      rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
                    }[status] || { bg: "bg-slate-100", text: "text-slate-700", label: status };
                  return (
                    <div key={doc.id ?? index}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#252B68]">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[#172033]">{label}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {doc.original_filename || doc.original_name || "—"}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center self-start rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                        {styles.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ReadOnlySection>

          {primaryAssessment && (
            <ReadOnlySection title="Assessment Details">
              <ReadOnlyGrid>
                <ReadOnlyField label="Assessment Type" value={primaryAssessment.assessment_type || "Assessment"} />
                <ReadOnlyField label="Date" value={
                  primaryAssessment.assessment_date
                    ? formatDateDisplay(primaryAssessment.assessment_date)
                    : null
                } />
                <ReadOnlyField label="Time" value={primaryAssessment.assessment_time} />
                <ReadOnlyField label="Location" value={primaryAssessment.location} />
                <ReadOnlyField label="Assessor" value={primaryAssessment.assessor?.name} />
                <ReadOnlyField label="Result" value={
                  primaryAssessment.result
                    ? String(primaryAssessment.result).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
                    : "Pending"
                } />
              </ReadOnlyGrid>
            </ReadOnlySection>
          )}

          {decisions.length > 0 && (
            <ReadOnlySection title="Admission Decision">
              <div className="space-y-3">
                {decisions.map((d: any) => (
                  <div key={d.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      d.decision === "approved"
                        ? "bg-green-50 text-green-700"
                        : d.decision === "denied"
                        ? "bg-red-50 text-red-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {d.decision}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">
                      {d.decision_date ? formatDateTimeDisplay(d.decision_date) : "—"}
                    </p>
                    {d.principal_comments && (
                      <p className="mt-2 text-sm text-slate-600">{d.principal_comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </ReadOnlySection>
          )}

          <div className="mt-8 rounded-2xl border border-[#252B68]/10 bg-[#252B68]/5 p-5">
            <div className="flex gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-[#252B68]" />
              <p className="text-sm leading-6 text-slate-600">
                Need to correct something? Contact the Mount View admissions
                office and quote application number{" "}
                <strong className="font-mono">{applicationNumber}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center print:hidden">
            <button type="button"
              onClick={() => {
                clearMessages(); setMode("landing");
                setApplicationStatus(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156]">
              <ArrowLeft size={16} /> Return to Admissions
            </button>
          </div>
        </div>
      </main>
    );
  }

  const pageContent = (() => {
    if (mode === "application") return renderApplication();
    if (mode === "track") return renderTracking();
    if (mode === "status") return renderStatus();
    return renderLanding();
  })();

  return (
    <>
      {pageContent}

      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setTermsViewed(true); setTermsAccepted(true);
            setShowTermsModal(false);
            setFieldErrors((current) => {
              const next = { ...current };
              delete next.terms;
              return next;
            });
          }}
        />
      )}

      {showEmailModal && (
        <div role="dialog" aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="border-b border-slate-100 bg-[#252B68] px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FFE900]">Admissions</p>
              <h2 className="mt-1 text-lg font-black">Start your application</h2>
              <p className="mt-1 text-xs text-white/70">
                We will email you the application number and access token you
                will use to return to your application.
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#172033]">
                  Email Address
                  <span className="ml-1 text-[#F58220]">*</span>
                </span>
                <input type="email" value={startEmail}
                  onChange={(e) => setStartEmail(e.target.value)}
                  placeholder="parent@example.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); startApplicationWithEmail();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
              </label>
              {emailModalError && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <AlertCircle size={15} /> {emailModalError}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowEmailModal(false)}
                  disabled={startingEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={startApplicationWithEmail}
                  disabled={startingEmail}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-bold text-white hover:bg-[#dd6e13] disabled:opacity-50">
                  {startingEmail ? "Creating..." : "Continue"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResendModal && (
        <div role="dialog" aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-[#252B68] px-6 py-5 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#FFE900]">Admissions</p>
                <h2 className="mt-1 text-lg font-black">Resend access details</h2>
                <p className="mt-1 text-xs text-white/70">
                  Enter the email you used to start the application. We will
                  resend your application number and access token.
                </p>
              </div>
              <button type="button" onClick={() => setShowResendModal(false)}
                className="shrink-0 rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {resendSuccess ? (
                <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  {resendSuccess}
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#172033]">
                      Email Address
                      <span className="ml-1 text-[#F58220]">*</span>
                    </span>
                    <input type="email" value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="parent@example.com"
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10" />
                  </label>
                  {resendError && (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                      <AlertCircle size={15} /> {resendError}
                    </p>
                  )}
                </>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowResendModal(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  {resendSuccess ? "Close" : "Cancel"}
                </button>
                {!resendSuccess && (
                  <button type="button" onClick={resendCredentials}
                    disabled={resending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-bold text-white hover:bg-[#dd6e13] disabled:opacity-50">
                    {resending ? "Sending..." : "Resend"}
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================== */
/* Sub-components                                                      */
/* ================================================================== */

function InfoBlock({
  icon, title, children,
}: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[#F58220]">{icon}</div>
      <h3 className="mt-4 font-bold text-[#252B68]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
    </div>
  );
}

function ReviewCard({
  title, items,
}: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <h3 className="font-black text-[#252B68]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div key={label}
            className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
            <span className="text-xs font-semibold text-slate-400">{label}</span>
            <span className="text-right text-sm font-semibold text-[#172033]">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsModal({
  onClose, onAccept,
}: { onClose: () => void; onAccept: () => void }) {
  return (
    <div role="dialog" aria-modal="true"
      aria-label="Mount View Terms and Conditions"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[100vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[#252B68] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFE900]">Admissions</p>
            <h2 className="mt-1 text-lg font-black sm:text-xl">
              Mount View Terms and Conditions
            </h2>
            <p className="mt-1 text-xs text-white/70">
              Please read carefully before accepting.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="shrink-0 rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Close terms">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-6 text-slate-700">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title} className="mb-8 last:mb-0">
              <h3 className="mb-3 text-base font-black text-[#252B68]">{section.title}</h3>
              <ol className="list-decimal space-y-3 pl-5">
                {section.items.map((item, idx) => (<li key={idx}>{item}</li>))}
              </ol>
            </section>
          ))}
          <section className="mt-6 rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-2 text-base font-black text-[#252B68]">
              Agreement and Signature
            </h3>
            <p className="italic text-slate-700">"{TERMS_AGREEMENT_STATEMENT}"</p>
          </section>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
            Close
          </button>
          <button type="button" onClick={onAccept}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-bold text-white hover:bg-[#dd6e13]">
            <Check size={17} />
            I Agree and Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadOnlySection({
  title, children,
}: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm print:break-inside-avoid print:shadow-none">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#252B68]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ReadOnlyGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function ReadOnlyField({
  label, value, block,
}: {
  label: string;
  value: string | number | null | undefined;
  block?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  return (
    <div className={block ? "" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#172033]">{display}</p>
    </div>
  );
}