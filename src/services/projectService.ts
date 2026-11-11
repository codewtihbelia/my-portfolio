import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Project } from "../types";
import { DEFAULT_PROJECTS } from "../data/initialData";
import { handleFirestoreError, OperationType } from "../lib/firestoreError";

const COLLECTION_NAME = "projects";

export function normalizeProject(id: string, data: any): Project {
  const title =
    data?.title || data?.name || data?.projectTitle || "Untitled Project";
  const slug =
    data?.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") ||
    id;

  let features: string[] = [];
  if (Array.isArray(data?.features)) {
    features = data.features;
  } else if (typeof data?.features === "string") {
    features = data.features
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  let technologies: string[] = [];
  if (Array.isArray(data?.technologies)) {
    technologies = data.technologies;
  } else if (typeof data?.technologies === "string") {
    technologies = data.technologies
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return {
    id,
    title,
    slug,
    shortDescription:
      data?.shortDescription ||
      data?.description?.slice(0, 150) ||
      data?.summary ||
      "",
    description: data?.description || data?.shortDescription || "",
    category: data?.category || "Full-Stack",
    status: data?.status || "Completed",
    role: data?.role || "",
    duration: data?.duration || "",
    client: data?.client || "",
    problem: data?.problem || "",
    solution: data?.solution || "",
    features,
    technologies,
    architecture: data?.architecture || "",
    architectureNodes: Array.isArray(data?.architectureNodes)
      ? data.architectureNodes
      : undefined,
    developmentProcess: data?.developmentProcess || "",
    challenges: data?.challenges || "",
    results: data?.results || "",
    liveUrl: data?.liveUrl || data?.url || data?.link || "",
    repositoryUrl: data?.repositoryUrl || data?.githubUrl || "",
    documentationUrl: data?.documentationUrl || "",
    thumbnail:
      data?.thumbnail ||
      data?.thumbnailUrl ||
      data?.image ||
      data?.heroImage ||
      "",
    heroImage: data?.heroImage || data?.thumbnail || "",
    featured: Boolean(data?.featured),
    order:
      typeof data?.order === "number"
        ? data.order
        : typeof data?.displayOrder === "number"
          ? data.displayOrder
          : 1,
    displayOrder:
      typeof data?.displayOrder === "number"
        ? data.displayOrder
        : typeof data?.order === "number"
          ? data.order
          : 1,
    published: data?.published !== false && data?.published !== "false",
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || new Date().toISOString(),
    ...data,
  };
}

export async function getProjects(
  includeUnpublished = false,
): Promise<Project[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);

    const projects: Project[] = [];
    snapshot.forEach((docSnap) => {
      const proj = normalizeProject(docSnap.id, docSnap.data());
      if (includeUnpublished || proj.published) {
        projects.push(proj);
      }
    });

    // Sort by order ascending, then by createdAt descending
    projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return projects;
  } catch (error: any) {
    console.warn("Projects fetch notice:", error?.message || error);
    return [];
  }
}

export function subscribeToProjects(
  callback: (projects: Project[]) => void,
  onError?: (err: any) => void,
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeProject(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      (err) => {
        console.warn(
          "Projects realtime subscription notice:",
          err?.message || err,
        );
        if (onError) {
          onError(err);
        }
      },
    );
  } catch (err) {
    console.warn("Projects realtime subscription init error:", err);
    return () => {};
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Try direct doc ID
      try {
        const directDoc = await getDoc(doc(db, COLLECTION_NAME, slug));
        if (directDoc.exists()) {
          return normalizeProject(directDoc.id, directDoc.data());
        }
      } catch {
        // Doc not found
      }
      return null;
    }

    const docSnap = snapshot.docs[0];
    return normalizeProject(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn("Error fetching project by slug:", error);
    return null;
  }
}

function cleanFirestoreData(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export async function createProject(
  project: Omit<Project, "id">,
): Promise<string> {
  try {
    const cleaned = cleanFirestoreData({
      ...project,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleaned);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updateProject(
  id: string,
  data: Partial<Project>,
): Promise<void> {
  try {
    const cleaned = cleanFirestoreData({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `${COLLECTION_NAME}/${id}`,
    );
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `${COLLECTION_NAME}/${id}`,
    );
  }
}

export async function seedProjectsToFirestore(): Promise<number> {
  let count = 0;
  for (const proj of DEFAULT_PROJECTS) {
    const { id, ...data } = proj;
    await setDoc(
      doc(db, COLLECTION_NAME, id),
      {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    count++;
  }
  return count;
}
