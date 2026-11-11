import { collection, doc, getDocs, setDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Profile, Project, Skill, Experience, Education, Certification, 
  Service, BlogPost, BlogCategory, SocialLink, Testimonial, SiteSettings, Resume 
} from '../types';

export interface SeedResult {
  profile: 'created' | 'already_exists';
  project: 'created' | 'already_exists';
  skill: 'created' | 'already_exists';
  experience: 'created' | 'already_exists';
  education: 'created' | 'already_exists';
  certification: 'created' | 'already_exists';
  service: 'created' | 'already_exists';
  blogCategory: 'created' | 'already_exists';
  blogPost: 'created' | 'already_exists';
  socialLink: 'created' | 'already_exists';
  testimonial: 'created' | 'already_exists';
  siteSettings: 'created' | 'already_exists';
  resume: 'created' | 'already_exists';
}

export async function seedInitialDatabase(): Promise<SeedResult> {
  const result: Partial<SeedResult> = {};

  try {
    // 1. Profile
    const profileRef = doc(db, 'profiles', 'main_profile');
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      const sampleProfile: Profile = {
        name: 'Codewithbelia',
        professionalTitle: 'Full-Stack Developer & Software Engineer',
        shortIntroduction: 'I design and develop modern, scalable, and user-focused digital solutions.',
        biography: 'I am a passionate full-stack developer focused on transforming real-world problems into practical digital solutions. I enjoy designing intuitive interfaces, building reliable backend systems, and creating technology that delivers meaningful value to its users.',
        location: 'Philippines',
        email: 'contact@codewithbelia.dev',
        phone: '',
        availability: 'Available for projects',
        availabilityMessage: 'Currently accepting freelance projects, contract engagements, and engineering roles.',
        yearsOfExperience: '3+',
        resumeUrl: '',
        githubUrl: 'https://github.com/codewithbelia',
        linkedinUrl: 'https://linkedin.com/in/codewithbelia',
        websiteUrl: 'https://codewithbelia.dev',
        profileImage: '',
        coverImage: '',
        updatedAt: new Date().toISOString()
      };
      await setDoc(profileRef, sampleProfile);
      result.profile = 'created';
    } else {
      result.profile = 'already_exists';
    }

    // 2. Site Settings
    const settingsRef = doc(db, 'siteSettings', 'main_settings');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      const sampleSettings: SiteSettings = {
        siteName: 'Codewithbelia Portfolio',
        siteDescription: 'Professional portfolio of a full-stack developer and digital solutions builder.',
        primaryEmail: 'contact@codewithbelia.dev',
        contactEmail: 'contact@codewithbelia.dev',
        location: 'Philippines',
        copyrightText: '© 2026 Codewithbelia. All Rights Reserved.',
        primaryColor: '#6366f1',
        maintenanceMode: false,
        showBlog: true,
        showServices: true,
        showTestimonials: true,
        showAnalytics: true
      };
      await setDoc(settingsRef, sampleSettings);
      result.siteSettings = 'created';
    } else {
      result.siteSettings = 'already_exists';
    }

    // 3. Project
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (projectsSnap.empty) {
      const sampleProject: Omit<Project, 'id'> = {
        title: 'Barangay Digital Ecosystem',
        slug: 'barangay-digital-ecosystem',
        shortDescription: 'A comprehensive digital platform designed to organize barangay services, records, projects, events, and community engagement.',
        description: 'The Barangay Digital Ecosystem is a modern centralized management platform created to resolve friction and delays in local governance. It brings resident registration, certificates issuance, incident reporting, social services tracking, and community public broadcasts together in a unified, cloud-backed architecture.',
        category: 'Full-Stack',
        status: 'Completed',
        featured: true,
        role: 'Full-Stack Developer',
        duration: '4 Months',
        client: 'Local Community Unit / Pilot Project',
        problem: 'Traditional manual processes can make community records, service requests, projects, events, and public information difficult to organize and access.',
        solution: 'A centralized digital platform that connects barangay management, public information, resident services, projects, events, and community engagement.',
        developmentProcess: 'Iterative design sprints starting from field interviews with administrative staff, followed by schema modeling in Firestore, UI component development, zero-trust security rule hardening, and pilot resident verification tests.',
        architecture: 'Client-first responsive web client communicating directly with Firestore databases guarded by strict role-based security rules. Sensitive operations are validated using cloud functions and signed storage buckets for document attachments.',
        challenges: 'Ensuring accessibility for residents on low-bandwidth mobile devices while guaranteeing zero-trust privacy for confidential resident demographic records.',
        results: 'Created a centralized digital ecosystem concept that brings multiple barangay workflows together in one platform, eliminating physical record misplacement and reducing request processing time.',
        features: [
          'Resident Management',
          'Document Requests',
          'Barangay Services',
          'Project Management',
          'Events Management',
          'Community Information',
          'Public Information Portal'
        ],
        technologies: [
          'Next.js',
          'TypeScript',
          'Firebase',
          'Cloud Firestore',
          'Firebase Storage',
          'Tailwind CSS'
        ],
        liveUrl: 'https://example.com/barangay-demo',
        repositoryUrl: 'https://github.com/example/barangay-digital-ecosystem',
        documentationUrl: 'https://example.com/docs/barangay-system',
        order: 1,
        published: true,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'projects'), sampleProject);
      result.project = 'created';
    } else {
      result.project = 'already_exists';
    }

    // 4. Skill
    const skillsSnap = await getDocs(collection(db, 'skills'));
    if (skillsSnap.empty) {
      const sampleSkill: Omit<Skill, 'id'> = {
        name: 'TypeScript',
        category: 'Frontend',
        level: 'Advanced',
        years: '3+',
        description: 'Used to build strongly typed and maintainable web applications.',
        featured: true,
        order: 1
      };
      await addDoc(collection(db, 'skills'), sampleSkill);

      // Seed a few complementary skills for a rich initial display
      const additionalSkills: Omit<Skill, 'id'>[] = [
        { name: 'React', category: 'Frontend', level: 'Expert', years: '3+', description: 'Component architecture, custom hooks, and state management.', featured: true, order: 2 },
        { name: 'Cloud Firestore', category: 'Database', level: 'Advanced', years: '3+', description: 'NoSQL schema design, security rules, and real-time syncing.', featured: true, order: 3 },
        { name: 'Tailwind CSS', category: 'Design', level: 'Expert', years: '3+', description: 'Responsive, accessible design systems and modern utility layout.', featured: true, order: 4 },
        { name: 'Node.js & Express', category: 'Backend', level: 'Intermediate', years: '2+', description: 'Server-side API routes and middleware services.', featured: false, order: 5 },
        { name: 'Git & GitHub', category: 'Tools', level: 'Advanced', years: '3+', description: 'Branching models, PR reviews, and automated CI/CD workflows.', featured: false, order: 6 }
      ];
      for (const s of additionalSkills) {
        await addDoc(collection(db, 'skills'), s);
      }
      result.skill = 'created';
    } else {
      result.skill = 'already_exists';
    }

    // 5. Experience
    const expSnap = await getDocs(collection(db, 'experiences'));
    if (expSnap.empty) {
      const sampleExp: Omit<Experience, 'id'> = {
        position: 'Full-Stack Developer',
        organization: 'Independent Developer',
        location: 'Philippines',
        employmentType: 'Freelance',
        startDate: '2024-01',
        current: true,
        description: 'Designing and developing full-stack web applications and digital management systems.',
        responsibilities: [
          'Design application architecture',
          'Develop responsive interfaces',
          'Build backend services',
          'Design database structures',
          'Implement authentication',
          'Deploy and maintain applications'
        ],
        technologies: ['TypeScript', 'React', 'Firebase', 'Node.js', 'Tailwind CSS'],
        order: 1
      };
      await addDoc(collection(db, 'experiences'), sampleExp);
      result.experience = 'created';
    } else {
      result.experience = 'already_exists';
    }

    // 6. Education
    const eduSnap = await getDocs(collection(db, 'education'));
    if (eduSnap.empty) {
      const sampleEdu: Omit<Education, 'id'> = {
        institution: 'Sample University',
        degree: "Bachelor's Degree",
        field: 'Information Technology',
        location: 'Philippines',
        startDate: '2020',
        endDate: '2024',
        description: 'Sample educational background demonstrating formal training in information technology and software development.',
        achievements: ['Dean\'s Lister', 'Capstone Project Lead Developer'],
        order: 1
      };
      await addDoc(collection(db, 'education'), sampleEdu);
      result.education = 'created';
    } else {
      result.education = 'already_exists';
    }

    // 7. Certification
    const certSnap = await getDocs(collection(db, 'certifications'));
    if (certSnap.empty) {
      const sampleCert: Omit<Certification, 'id'> = {
        name: 'Professional Web Development Certificate',
        issuer: 'Sample Technology Academy',
        credentialId: 'CERT-2026-001',
        issueDate: '2026-01-15',
        description: 'Sample professional certification demonstrating web development knowledge.',
        credentialUrl: 'https://example.com/credentials/CERT-2026-001'
      };
      await addDoc(collection(db, 'certifications'), sampleCert);
      result.certification = 'created';
    } else {
      result.certification = 'already_exists';
    }

    // 8. Service
    const servSnap = await getDocs(collection(db, 'services'));
    if (servSnap.empty) {
      const sampleService: Omit<Service, 'id'> = {
        title: 'Full-Stack Web Development',
        slug: 'full-stack-web-development',
        description: 'Development of complete web applications covering frontend, backend, database, authentication, and deployment.',
        features: [
          'Responsive frontend',
          'Backend development',
          'Database integration',
          'Authentication',
          'API development',
          'Deployment'
        ],
        featured: true,
        order: 1
      };
      await addDoc(collection(db, 'services'), sampleService);
      result.service = 'created';
    } else {
      result.service = 'already_exists';
    }

    // 9. Blog Category & Post
    const catSnap = await getDocs(collection(db, 'blogCategories'));
    if (catSnap.empty) {
      await addDoc(collection(db, 'blogCategories'), {
        name: 'Development',
        slug: 'development',
        description: 'Articles on modern web development and software architecture.'
      });
      result.blogCategory = 'created';
    } else {
      result.blogCategory = 'already_exists';
    }

    const blogSnap = await getDocs(collection(db, 'blogPosts'));
    if (blogSnap.empty) {
      const samplePost: Omit<BlogPost, 'id'> = {
        title: 'Building a Full-Stack Digital System From the Ground Up',
        slug: 'building-a-full-stack-digital-system',
        excerpt: 'A practical look at how a real-world digital platform can be planned, architected, developed, and deployed.',
        category: 'Development',
        tags: ['Full-Stack', 'Firebase', 'Web Development', 'System Architecture'],
        author: 'Codewithbelia',
        status: 'Published',
        featured: true,
        readingTime: '5 min',
        publishedAt: '2026-02-10',
        content: `## The Anatomy of Modern Full-Stack Systems

Building real-world digital systems requires balancing architectural rigor with intuitive user experiences. When embarking on platforms that serve multi-role communities, our foundational decisions dictate longevity and developer velocity.

### 1. Planning and Domain Modeling
Before writing the first component, dissecting the domain into clear entities prevents cascading refactors. Identifying bounded contexts and separating read models from transactional models ensures Firestore documents remain lean.

### 2. Zero-Trust Security by Design
Never defer database rules to post-launch. By modeling Attribute-Based Access Control directly in security rules, applications guard against update-gaps and orphaned writes before frontend forms are even wired up.

### 3. Progressive Enhancement
A platform should gracefully adapt to varied network conditions. Clean loading states, optimistic UI updates, and cached local queries empower users regardless of bandwidth limitations.`,
        seoTitle: 'Building a Full-Stack Digital System - Case Study',
        seoDescription: 'A practical look at planning, developing, and deploying a secure full-stack application.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'blogPosts'), samplePost);
      result.blogPost = 'created';
    } else {
      result.blogPost = 'already_exists';
    }

    // 10. Social Link
    const socialSnap = await getDocs(collection(db, 'socialLinks'));
    if (socialSnap.empty) {
      const sampleSocial: Omit<SocialLink, 'id'> = {
        platform: 'GitHub',
        url: 'https://github.com/codewithbelia',
        username: 'codewithbelia',
        enabled: true,
        order: 1
      };
      await addDoc(collection(db, 'socialLinks'), sampleSocial);

      // Additional social links for rich UI
      await addDoc(collection(db, 'socialLinks'), {
        platform: 'LinkedIn',
        url: 'https://linkedin.com/in/codewithbelia',
        username: 'codewithbelia',
        enabled: true,
        order: 2
      });
      result.socialLink = 'created';
    } else {
      result.socialLink = 'already_exists';
    }

    // 11. Testimonial
    const testSnap = await getDocs(collection(db, 'testimonials'));
    if (testSnap.empty) {
      const sampleTestimonial: Omit<Testimonial, 'id'> = {
        name: 'Jordan Smith',
        position: 'Project Coordinator',
        organization: 'Sample Organization',
        message: 'Codewithbelia demonstrated strong technical thinking and consistently transformed complex requirements into practical digital solutions.',
        rating: 5,
        approved: true,
        featured: true,
        order: 1
      };
      await addDoc(collection(db, 'testimonials'), sampleTestimonial);
      result.testimonial = 'created';
    } else {
      result.testimonial = 'already_exists';
    }

    // 12. Resume
    const resumeSnap = await getDocs(collection(db, 'resume'));
    if (resumeSnap.empty) {
      const sampleResume: Omit<Resume, 'id'> = {
        title: 'Codewithbelia - Full Stack Resume (2026)',
        fileUrl: '',
        version: 'v2.4',
        active: true,
        summary: 'Full-stack software engineer with 3+ years building robust web applications, cloud backends, and responsive user interfaces.',
        downloadCount: 14,
        uploadedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'resume'), sampleResume);
      result.resume = 'created';
    } else {
      result.resume = 'already_exists';
    }

    // Mark database as initialized
    try {
      const initRef = doc(db, 'siteSettings', 'initialized');
      await setDoc(initRef, {
        initialized: true,
        initializedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not write initialization marker doc:', e);
    }

    return result as SeedResult;
  } catch (error) {
    console.warn('Initial database seed note (database is in read-only mode or already seeded):', error);
    return result as SeedResult;
  }
}

export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; result: SeedResult }> {
  const result = await seedInitialDatabase();
  const seeded = Object.values(result).some((status) => status === 'created');
  return { seeded, result };
}
