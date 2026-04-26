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

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed.");
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