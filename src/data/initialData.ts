import { Project, BlogPost, SocialLink, Testimonial, Resume, Skill, Experience, Education, Certification } from '../types';

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'barangay-digital-ecosystem',
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
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-02-20T00:00:00.000Z'
  },
  {
    id: 'cloud-analytics-dashboard',
    title: 'Cloud Fleet Analytics Dashboard',
    slug: 'cloud-fleet-analytics',
    shortDescription: 'High-density telemetry dashboard displaying real-time metrics, node states, and error tracing.',
    description: 'An interactive operational dashboard providing engineering teams with centralized real-time observability across edge computing nodes and container instances.',
    category: 'Frontend',
    status: 'Completed',
    featured: true,
    role: 'Lead Frontend Engineer',
    duration: '3 Months',
    client: 'Enterprise Client',
    problem: 'Disparate logging streams prevented engineers from spotting cascading failure bottlenecks in distributed clusters.',
    solution: 'A unified high-throughput visual cockpit with sub-second websocket streaming updates and customizable alerts.',
    developmentProcess: 'Developed low-latency canvas charts with WebGL acceleration and synchronized time-series filters.',
    architecture: 'Single-page application paired with real-time websocket brokers and offline buffer state.',
    challenges: 'Rendering 10,000+ data points per second at 60 frames per second without UI stuttering.',
    results: 'Decreased Mean Time to Resolution (MTTR) by 45% during pilot deployment.',
    features: ['Real-time Stream Plotting', 'Custom Alarm Thresholds', 'Time-range Scrubbing', 'Incident Exports'],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts', 'WebSockets'],
    liveUrl: 'https://example.com/analytics-demo',
    repositoryUrl: 'https://github.com/example/fleet-dashboard',
    order: 2,
    published: true,
    thumbnail: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1400&q=80',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-25T00:00:00.000Z'
  }
];

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'building-a-full-stack-digital-system',
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
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:00:00.000Z'
  },
  {
    id: 'mastering-type-safety-in-modern-web-apps',
    title: 'Mastering End-to-End Type Safety in Modern TypeScript Applications',
    slug: 'mastering-type-safety-in-modern-web-apps',
    excerpt: 'Strategies for maintaining airtight type contracts from database schema to UI components.',
    category: 'Architecture',
    tags: ['TypeScript', 'Best Practices', 'Type Systems'],
    author: 'Codewithbelia',
    status: 'Published',
    featured: false,
    readingTime: '4 min',
    publishedAt: '2026-02-18',
    content: `## Why End-to-End Type Safety Matters

Catching bugs before runtime is the cornerstone of maintainable enterprise applications. In this article, we explore type guards, zod schema validations, and generic utility types that guarantee compile-time sanity across your application layer.`,
    seoTitle: 'End-to-End Type Safety in TypeScript',
    seoDescription: 'Strategies for airtight type contracts across modern web applications.',
    createdAt: '2026-02-18T00:00:00.000Z',
    updatedAt: '2026-02-18T00:00:00.000Z'
  }
];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'github',
    platform: 'GitHub',
    url: 'https://github.com/example',
    username: 'alexdeveloper',
    enabled: true,
    order: 1
  },
  {
    id: 'linkedin',
    platform: 'LinkedIn',
    url: 'https://linkedin.com/in/example',
    username: 'alexdeveloper',
    enabled: true,
    order: 2
  },
  {
    id: 'twitter',
    platform: 'Twitter',
    url: 'https://twitter.com/example',
    username: '@alexdeveloper',
    enabled: true,
    order: 3
  }
];

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Maria Santos',
    authorName: 'Maria Santos',
    position: 'Project Director',
    authorTitle: 'Project Director',
    organization: 'Community Innovation Lab',
    message: 'Codewithbelia demonstrated exceptional craftsmanship in delivering our digital platform on schedule. The clean architecture and intuitive UI surpassed our expectations.',
    content: 'Codewithbelia demonstrated exceptional craftsmanship in delivering our digital platform on schedule. The clean architecture and intuitive UI surpassed our expectations.',
    rating: 5,
    featured: true,
    approved: true,
    order: 1,
    createdAt: '2026-01-20T00:00:00.000Z'
  },
  {
    id: 'testimonial-2',
    name: 'David Chen',
    authorName: 'David Chen',
    position: 'Engineering Manager',
    authorTitle: 'Engineering Manager',
    organization: 'Nexus Tech Solutions',
    message: 'A dedicated engineer who thinks deeply about user experience and backend scalability. Working with Codewithbelia was seamless and productive.',
    content: 'A dedicated engineer who thinks deeply about user experience and backend scalability. Working with Codewithbelia was seamless and productive.',
    rating: 5,
    featured: true,
    approved: true,
    order: 2,
    createdAt: '2026-02-05T00:00:00.000Z'
  }
];

export const DEFAULT_RESUME: Resume = {
  id: 'resume-main',
  title: 'Codewithbelia_Resume_2026.pdf',
  filename: 'Codewithbelia_Resume_2026.pdf',
  fileUrl: '',
  version: '2026.1',
  fileSize: '185 KB',
  active: true,
  downloadCount: 42,
  uploadedAt: '2026-02-01T00:00:00.000Z',
  summary: 'Current updated 2026 resume highlighting full-stack engineering, TypeScript, and cloud architecture experience.',
  notes: 'Current updated 2026 resume highlighting full-stack engineering, TypeScript, and cloud architecture experience.'
};

export const DEFAULT_SKILLS: Skill[] = [
  { id: 'ts', name: 'TypeScript', category: 'Frontend', level: 'Advanced', years: '3+', description: 'Used to build strongly typed and maintainable web applications.', featured: true, order: 1 },
  { id: 'react', name: 'React', category: 'Frontend', level: 'Expert', years: '3+', description: 'Component architecture, custom hooks, and state management.', featured: true, order: 2 },
  { id: 'firestore', name: 'Cloud Firestore', category: 'Database', level: 'Advanced', years: '3+', description: 'NoSQL schema design, security rules, and real-time syncing.', featured: true, order: 3 },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Design', level: 'Expert', years: '3+', description: 'Responsive, accessible design systems and modern utility layout.', featured: true, order: 4 },
  { id: 'node', name: 'Node.js & Express', category: 'Backend', level: 'Intermediate', years: '2+', description: 'Server-side API routes and middleware services.', featured: false, order: 5 },
  { id: 'git', name: 'Git & GitHub', category: 'Tools', level: 'Advanced', years: '3+', description: 'Branching models, PR reviews, and automated CI/CD workflows.', featured: false, order: 6 }
];

export const DEFAULT_EXPERIENCES: Experience[] = [
  {
    id: 'exp-1',
    position: 'Full-Stack Developer',
    organization: 'Independent Developer & Solutions Builder',
    location: 'Philippines',
    employmentType: 'Freelance',
    startDate: '2024-01',
    current: true,
    description: 'Designing and developing full-stack web applications and digital management systems for clients.',
    responsibilities: [
      'Design modular application architecture',
      'Develop responsive interfaces and accessible component systems',
      'Build backend services and cloud database structures',
      'Implement authentication and zero-trust security rules'
    ],
    technologies: ['TypeScript', 'React', 'Firebase', 'Cloud Firestore', 'Node.js', 'Tailwind CSS'],
    order: 1
  }
];

export const DEFAULT_SERVICES = [
  {
    id: 'service-1',
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
  }
];

export const DEFAULT_EDUCATION: Education[] = [
  {
    id: 'edu-1',
    institution: 'Technological University / Academy',
    degree: "Bachelor of Science",
    field: 'Information Technology / Computer Science',
    location: 'Philippines',
    startDate: '2020',
    endDate: '2024',
    description: 'Specialized in Software Engineering, Database Management Systems, Network Architecture, and Web Development.',
    achievements: [
      "Dean's List Awardee for Academic Excellence",
      'Capstone Lead Developer — Local Governance Digital Ecosystem',
      'President, Computer & IT Students Society'
    ],
    order: 1
  }
];

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    name: 'Full-Stack Cloud Architecture & Development',
    issuer: 'Professional Developer Institute',
    credentialId: 'PDI-2025-CS941',
    issueDate: '2025-06',
    description: 'Rigorous accreditation covering modern React architectures, serverless backends, NoSQL database design, and cloud deployments.',
    credentialUrl: 'https://example.com/verify/PDI-2025-CS941'
  },
  {
    id: 'cert-2',
    name: 'Advanced TypeScript & Component Engineering',
    issuer: 'Web Engineering Certification Board',
    credentialId: 'WECB-88310',
    issueDate: '2024-11',
    description: 'Comprehensive evaluation of type systems, scalable design patterns, and front-end performance optimization.',
    credentialUrl: 'https://example.com/verify/WECB-88310'
  }
];

