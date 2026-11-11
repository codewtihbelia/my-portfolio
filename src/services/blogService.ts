import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost, BlogCategory } from '../types';

const POSTS_COLLECTION = 'blogPosts';
const CATEGORIES_COLLECTION = 'blogCategories';

export async function getBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
  try {
    const colRef = collection(db, POSTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const list: BlogPost[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isPublished = (
        data.status === 'Published' || 
        data.status === 'published' || 
        data.published === true || 
        data.isPublished === true
      ) && data.status !== 'Draft' && data.status !== 'draft';

      if (includeDrafts || isPublished) {
        list.push({ 
          id: docSnap.id, 
          ...data,
          status: isPublished ? 'Published' : 'Draft',
          published: isPublished,
          isPublished: isPublished
        } as BlogPost);
      }
    });

    list.sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt || '';
      const dateB = b.publishedAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    return list;
  } catch (error) {
    console.warn('Blog posts fetch notice:', error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const colRef = collection(db, POSTS_COLLECTION);
    const q = query(colRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Direct doc check as fallback by ID
      const directDoc = await getDoc(doc(db, POSTS_COLLECTION, slug));
      if (directDoc.exists()) {
        const data = directDoc.data();
        const isPublished = (
          data.status === 'Published' || 
          data.status === 'published' || 
          data.published === true || 
          data.isPublished === true
        ) && data.status !== 'Draft' && data.status !== 'draft';
        return { 
          id: directDoc.id, 
          ...data,
          status: isPublished ? 'Published' : 'Draft',
          published: isPublished,
          isPublished: isPublished
        } as BlogPost;
      }

      // Check all docs in case slug was case-insensitive or encoded
      const allDocs = await getDocs(colRef);
      const match = allDocs.docs.find((d) => {
        const dData = d.data();
        return (dData.slug && dData.slug.toLowerCase() === slug.toLowerCase()) || d.id === slug;
      });
      if (match) {
        const data = match.data();
        const isPublished = (
          data.status === 'Published' || 
          data.status === 'published' || 
          data.published === true || 
          data.isPublished === true
        ) && data.status !== 'Draft' && data.status !== 'draft';
        return { 
          id: match.id, 
          ...data,
          status: isPublished ? 'Published' : 'Draft',
          published: isPublished,
          isPublished: isPublished
        } as BlogPost;
      }
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const isPublished = (
      data.status === 'Published' || 
      data.status === 'published' || 
      data.published === true || 
      data.isPublished === true
    ) && data.status !== 'Draft' && data.status !== 'draft';
    return { 
      id: docSnap.id, 
      ...data,
      status: isPublished ? 'Published' : 'Draft',
      published: isPublished,
      isPublished: isPublished
    } as BlogPost;
  } catch (error) {
    console.warn('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function createBlogPost(data: Omit<BlogPost, 'id'>): Promise<string> {
  try {
    const isPub = (data.status === 'Published' || data.published === true || data.isPublished === true) && data.status !== 'Draft';
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...data,
      status: isPub ? 'Published' : 'Draft',
      published: isPub,
      isPublished: isPub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<void> {
  try {
    const isPub = data.status !== undefined 
      ? data.status === 'Published' 
      : (data.published !== undefined ? data.published : data.isPublished);

    const docRef = doc(db, POSTS_COLLECTION, id);
    const updatePayload: Record<string, any> = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    if (isPub !== undefined) {
      updatePayload.status = isPub ? 'Published' : 'Draft';
      updatePayload.published = Boolean(isPub);
      updatePayload.isPublished = Boolean(isPub);
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, POSTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}

// Categories
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const list: BlogCategory[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as BlogCategory);
    });
    return list;
  } catch (error) {
    console.warn('Blog categories fetch notice:', error);
    return [];
  }
}

export async function createBlogCategory(data: Omit<BlogCategory, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog category:', error);
    throw error;
  }
}
