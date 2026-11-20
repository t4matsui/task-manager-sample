export type Task = {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

type TaskInput = {
  title: string;
  description: string;
};

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || `APIエラー (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listTasks(accessToken: string): Promise<Task[]> {
  return request<Task[]>("/tasks", accessToken);
}

export function createTask(
  accessToken: string,
  input: TaskInput,
): Promise<Task> {
  return request<Task>("/tasks", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTask(
  accessToken: string,
  id: string,
  input: Partial<TaskInput> & { is_completed?: boolean },
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTask(accessToken: string, id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, accessToken, { method: "DELETE" });
}
