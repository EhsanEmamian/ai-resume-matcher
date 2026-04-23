const API_BASE_URL = "http://localhost:8000";

export async function uploadAndParseResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resumes/upload-and-parse`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload and parse resume.");
  }

  return data;
}
