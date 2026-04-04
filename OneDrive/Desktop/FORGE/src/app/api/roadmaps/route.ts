import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TEMPLATES: Record<string, { title: string; tracks: Array<{ title: string; color: string; phases: Array<{ title: string; tasks: Array<{ title: string; detail: string }> }> }> }> = {
  fullstack: {
    title: "Full-Stack Web Development",
    tracks: [
      {
        title: "Frontend",
        color: "#00c8ff",
        phases: [
          { title: "HTML & CSS Fundamentals", tasks: [
            { title: "HTML Structure & Semantic Elements", detail: "Learn HTML5 semantic elements (header, main, section, article, footer). Build a complete webpage structure from scratch without any CSS." },
            { title: "CSS Box Model & Layouts", detail: "Master the CSS box model (margin, border, padding, content). Build layouts using Flexbox and Grid." },
            { title: "Responsive Design", detail: "Build a fully responsive webpage using media queries and mobile-first approach." },
          ]},
          { title: "JavaScript", tasks: [
            { title: "JS Fundamentals", detail: "Variables, data types, functions, loops, arrays, objects. Build 3 small programs demonstrating each concept." },
            { title: "DOM Manipulation", detail: "Query and modify DOM elements. Build an interactive to-do list using vanilla JS." },
            { title: "Fetch API & Async JS", detail: "Promises, async/await, fetch API. Build a weather app consuming a public REST API." },
          ]},
          { title: "React", tasks: [
            { title: "React Fundamentals & JSX", detail: "Components, props, JSX syntax. Convert your vanilla JS to-do list into a React app." },
            { title: "State & Effects", detail: "useState, useEffect, controlled components. Build a CRUD app with local state." },
            { title: "React Router & Context", detail: "Multi-page navigation, global state. Build a multi-page React application." },
          ]},
        ],
      },
      {
        title: "Backend",
        color: "#ff7c3a",
        phases: [
          { title: "Node.js & Express", tasks: [
            { title: "Node.js Fundamentals", detail: "Event loop, modules, file system. Build a CLI tool using Node.js built-ins." },
            { title: "Express REST API", detail: "Build a full CRUD REST API with Express.js. Include proper error handling and status codes." },
            { title: "Authentication with JWT", detail: "Implement user registration, login, and JWT-based authentication in your API." },
          ]},
          { title: "Databases", tasks: [
            { title: "PostgreSQL & SQL", detail: "Install PostgreSQL, learn basic SQL queries. Create a normalized database schema." },
            { title: "Prisma ORM", detail: "Set up Prisma with your PostgreSQL database. Implement CRUD operations using Prisma." },
            { title: "Full-Stack Integration", detail: "Connect your React frontend to your Express backend. Build a complete full-stack application." },
          ]},
        ],
      },
    ],
  },
  datascience: {
    title: "Data Science",
    tracks: [
      {
        title: "Python & Data",
        color: "#a6e3a1",
        phases: [
          { title: "Python Fundamentals", tasks: [
            { title: "Python Basics", detail: "Variables, data types, control flow, functions. Build 5 programs demonstrating Python fundamentals." },
            { title: "NumPy & Pandas", detail: "Array operations with NumPy, data manipulation with Pandas. Analyze a real dataset." },
            { title: "Data Visualization", detail: "Create charts with Matplotlib and Seaborn. Build a complete EDA (Exploratory Data Analysis) notebook." },
          ]},
          { title: "Machine Learning", tasks: [
            { title: "Scikit-Learn Basics", detail: "Train/test split, linear regression, decision trees. Build and evaluate a regression model." },
            { title: "Classification & Evaluation", detail: "Logistic regression, random forests, confusion matrix, ROC curve. Build a classification model." },
            { title: "Model Deployment", detail: "Save models with pickle/joblib. Build a Flask API that serves ML predictions." },
          ]},
        ],
      },
    ],
  },
  aiml: {
    title: "AI/ML Engineering",
    tracks: [
      {
        title: "Deep Learning",
        color: "#cba6f7",
        phases: [
          { title: "PyTorch Fundamentals", tasks: [
            { title: "Tensors & Autograd", detail: "PyTorch tensors, operations, gradient computation. Implement a simple neural network from scratch." },
            { title: "Neural Networks", detail: "Build, train, and evaluate a multi-layer perceptron for classification." },
            { title: "CNNs", detail: "Build a convolutional neural network for image classification." },
          ]},
          { title: "LLMs & Fine-tuning", tasks: [
            { title: "Transformers & HuggingFace", detail: "Load pre-trained models from HuggingFace. Fine-tune a model on a custom dataset." },
            { title: "LLM APIs", detail: "Use OpenAI/Anthropic APIs to build a chatbot application." },
            { title: "RAG Application", detail: "Build a Retrieval-Augmented Generation application with a vector database." },
          ]},
        ],
      },
    ],
  },
};

const createSchema = z.object({
  title: z.string().min(1).max(200),
  templateId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { title, templateId } = parsed.data;
  const template = templateId ? TEMPLATES[templateId] : null;
  const roadmapTitle = template?.title ?? title;

  // Deactivate existing roadmaps (free tier: 1 active)
  await prisma.roadmap.updateMany({
    where: { userId: session.user.id, isActive: true },
    data: { isActive: false },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId: session.user.id,
      title: roadmapTitle,
      isActive: true,
      tracks: template
        ? {
            create: template.tracks.map((track, ti) => ({
              title: track.title,
              color: track.color,
              sortOrder: ti,
              phases: {
                create: track.phases.map((phase, pi) => ({
                  title: phase.title,
                  sortOrder: pi,
                  tasks: {
                    create: phase.tasks.map((task, tki) => ({
                      title: task.title,
                      detail: task.detail,
                      sortOrder: tki,
                      status: pi === 0 && tki === 0 ? "available" : "locked",
                    })),
                  },
                })),
              },
            })),
          }
        : {
            create: [{
              title: "Main Track",
              color: "#00c8ff",
              sortOrder: 0,
              phases: {
                create: [{
                  title: "Phase 1",
                  sortOrder: 0,
                  tasks: {
                    create: [{
                      title: "First Task",
                      detail: "Define what you want to accomplish in this task. Be specific about what you will build or learn.",
                      sortOrder: 0,
                      status: "available",
                    }],
                  },
                }],
              },
            }],
          },
    },
  });

  // Create streak record
  await prisma.streak.create({
    data: { userId: session.user.id, roadmapId: roadmap.id },
  });

  return NextResponse.json({ roadmapId: roadmap.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { streaks: { where: { userId: session.user.id } } },
  });

  return NextResponse.json({ roadmaps });
}
