export const sampleResumeData = {
  personal: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "janedoe.dev",
    linkedin: "linkedin.com/in/janedoe",
    github: "github.com/janedoe"
  },
  education: [
    {
      id: "edu1",
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
      start: "2018-08",
      end: "2022-05",
      gpa: "3.8",
      honors: "Magna Cum Laude"
    }
  ],
  experience: [
    {
      id: "exp1",
      company: "Tech Corp",
      role: "Senior Software Engineer",
      start: "2022-06",
      end: "Present",
      tags: ["backend", "python", "aws", "distributed-systems"],
      bullets: [
        {
          id: "exp1-b1",
          text: "Designed and built scalable microservices handling 2M+ daily API requests, reducing p99 latency by 40% using Python, FastAPI, and Redis caching.",
          tags: ["backend", "python", "scalability", "performance"]
        },
        {
          id: "exp1-b2",
          text: "Led migration of monolithic application to event-driven architecture using AWS SQS/SNS, improving system reliability from 98.5% to 99.95% uptime.",
          tags: ["aws", "architecture", "reliability", "distributed-systems"]
        },
        {
          id: "exp1-b3",
          text: "Mentored 4 junior engineers through weekly 1:1s and code reviews, resulting in 30% faster onboarding and measurably improved code quality.",
          tags: ["leadership", "mentorship"]
        }
      ]
    },
    {
      id: "exp2",
      company: "Startup Inc",
      role: "Software Engineer",
      start: "2020-05",
      end: "2022-05",
      tags: ["fullstack", "react", "node", "postgresql"],
      bullets: [
        {
          id: "exp2-b1",
          text: "Built a real-time analytics dashboard using React and D3.js, enabling product team to reduce experiment cycle time by 50%.",
          tags: ["frontend", "react", "data-visualization"]
        },
        {
          id: "exp2-b2",
          text: "Implemented end-to-end payment processing flow with Stripe integration, processing $500K+ in transactions in the first quarter post-launch.",
          tags: ["backend", "payments", "node"]
        },
        {
          id: "exp2-b3",
          text: "Optimized PostgreSQL queries and added connection pooling via PgBouncer, reducing average query time from 800ms to 45ms.",
          tags: ["backend", "database", "performance", "postgresql"]
        }
      ]
    }
  ],
  projects: [
    {
      id: "proj1",
      name: "AI Resume Builder",
      role: "Full-Stack Developer",
      start: "2024-01",
      end: "2024-04",
      tags: ["react", "ai", "llm", "typescript"],
      bullets: [
        {
          id: "proj1-b1",
          text: "Built an AI-powered resume tailoring tool using React and Claude API that automatically selects and rewrites bullet points to match job descriptions.",
          tags: ["react", "ai", "frontend"]
        },
        {
          id: "proj1-b2",
          text: "Implemented PDF generation pipeline supporting A4 and US Letter formats with customizable themes and real-time preview using @react-pdf/renderer.",
          tags: ["react", "pdf", "frontend"]
        }
      ]
    },
    {
      id: "proj2",
      name: "Distributed Rate Limiter",
      role: "Author & Maintainer",
      start: "2023-03",
      end: "2023-07",
      tags: ["golang", "redis", "distributed-systems"],
      bullets: [
        {
          id: "proj2-b1",
          text: "Developed a distributed rate limiting library in Go supporting sliding window and token bucket algorithms, published on GitHub with 200+ stars.",
          tags: ["golang", "distributed-systems", "open-source"]
        },
        {
          id: "proj2-b2",
          text: "Benchmarked throughput at 50K requests/sec with <1ms overhead using Redis Lua scripts for atomic operations.",
          tags: ["performance", "redis", "golang"]
        }
      ]
    }
  ],
  skills: [
    {
      id: "skill1",
      category: "Languages",
      items: ["Python", "JavaScript", "TypeScript", "Go", "SQL"]
    },
    {
      id: "skill2",
      category: "Frameworks & Libraries",
      items: ["React", "FastAPI", "Node.js", "Django", "D3.js"]
    },
    {
      id: "skill3",
      category: "Infrastructure & Tools",
      items: ["AWS (SQS, SNS, EC2, RDS)", "Docker", "Kubernetes", "PostgreSQL", "Redis", "Git"]
    },
    {
      id: "skill4",
      category: "Concepts",
      items: ["Microservices", "Event-driven Architecture", "REST APIs", "System Design", "Agile/Scrum"]
    }
  ]
};

export function downloadSampleJson() {
  const blob = new Blob([JSON.stringify(sampleResumeData, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume-sample.json';
  a.click();
  URL.revokeObjectURL(url);
}
