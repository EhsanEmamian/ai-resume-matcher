const API_BASE_URL = "http://localhost:8000";

export type ResumeProfile = {
  id: string;
  resume_id: string;
  skills: string[];
  technologies: string[];
  languages: string[];
  years_of_experience: number | null;
  seniority_level: string | null;
  suggested_roles: string[];
  raw_ai_response?: Record<string, unknown> | null;
  parsed_at: string;
};

export type ResumeUploadAndParseResponse = {
  resume_id: string;
  filename: string;
  content_type: string;
  uploaded_at: string;
  profile: ResumeProfile;
};

export type MatchItem = {
  id: string;
  score: number;
  reason: string;
  score_breakdown: {
    skill_overlap_score: number;
    role_overlap_score: number;
    remote_bonus: number;
    final_score: number;
  } | null;
  matched_skills: string[] | null;
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    required_skills: string[];
    required_languages: string[];
    experience_requirement: string | null;
    salary_text: string | null;
    location: string | null;
    remote: boolean;
  };
};

export type ResumeFullResponse = {
  id: string;
  filename: string;
  content_type: string;
  file_path: string;
  raw_text: string;
  uploaded_at: string;
  profile: ResumeProfile | null;
  matches: MatchItem[];
};

export type IngestJobsRequest = {
  keyword: string;
  location: string;
  country: string;
  max_results: number;
};

export type IngestJobsResult = {
  fetched: number;
  created: number;
  skipped: number;
  errors: number;
  keyword: string;
  location: string;
  country: string;
};

export type JobItem = {
  id: string;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  required_languages: string[];
  experience_requirement: string | null;
  salary_text: string | null;
  location: string | null;
  remote: boolean;
  source: string;
  source_text: string | null;
  source_id: string | null;
  source_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  contract_type: string | null;
  category: string | null;
  posted_at: string | null;
  created_at: string;
};

export type JobsListResponse = {
  total: number;
  items: JobItem[];
};

export type ExternalJobSearchRequest = {
  keyword: string;
  location: string;
  country: string;
  max_results: number;
  page: number;
};

export type ExternalJobItem = {
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  required_languages: string[];
  experience_requirement: string | null;
  salary_text: string | null;
  location: string | null;
  remote: boolean;
  source: string;
  source_text: string | null;
  source_id: string | null;
  source_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  contract_type: string | null;
  category: string | null;
  posted_at: string | null;
};

export type ExternalJobSearchResult = {
  total: number;
  items: ExternalJobItem[];
  keyword: string;
  location: string;
  country: string;
  page: number;
};

export type ImportExternalJobResult = {
  status: string;
  job: JobItem;
};

export type ClearJobsBySourceResult = {
  source: string;
  deleted: number;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const detail = data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : typeof detail?.message === "string"
          ? detail.message
          : "Request failed.";

    throw new ApiError(message, response.status, detail);
  }

  return data as T;
}

export async function uploadAndParseResume(
  file: File
): Promise<ResumeUploadAndParseResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resumes/upload-and-parse`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<ResumeUploadAndParseResponse>(response);
}

export async function getResumeFull(
  resumeId: string
): Promise<ResumeFullResponse> {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/full`);
  return handleResponse<ResumeFullResponse>(response);
}

export async function generateMatches(resumeId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/matches/${resumeId}`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to generate matches.");
  }
}

export async function getMatches(
  resumeId: string
): Promise<{ items: MatchItem[] }> {
  const response = await fetch(
    `${API_BASE_URL}/matches/${resumeId}?min_score=0&sort_by=score`
  );
  return handleResponse<{ items: MatchItem[] }>(response);
}

export async function ingestJobs(
  payload: IngestJobsRequest
): Promise<IngestJobsResult> {
  const response = await fetch(`${API_BASE_URL}/jobs/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<IngestJobsResult>(response);
}

export async function getJobs(
  skip = 0,
  limit = 20
): Promise<JobsListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/jobs?skip=${skip}&limit=${limit}`
  );
  return handleResponse<JobsListResponse>(response);
}

export async function getJob(jobId: string): Promise<JobItem> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  return handleResponse<JobItem>(response);
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: "DELETE",
  });

  return handleResponse<void>(response);
}

export async function clearJobsBySource(
  source: string
): Promise<ClearJobsBySourceResult> {
  const response = await fetch(
    `${API_BASE_URL}/jobs/clear-by-source?source=${encodeURIComponent(source)}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<ClearJobsBySourceResult>(response);
}

export async function searchExternalJobs(
  payload: ExternalJobSearchRequest
): Promise<ExternalJobSearchResult> {
  const response = await fetch(`${API_BASE_URL}/jobs/search-external`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ExternalJobSearchResult>(response);
}

export async function importExternalJob(
  payload: ExternalJobItem
): Promise<ImportExternalJobResult> {
  const response = await fetch(`${API_BASE_URL}/jobs/import-external`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ImportExternalJobResult>(response);
}