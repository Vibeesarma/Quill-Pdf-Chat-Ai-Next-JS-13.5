# Quill Pdf Reader AI in Next.js 13.5.3
![Screenshot 2023-11-12 085547](https://github.com/Vibeesarma/Quill-Pdf-Chat-Ai-Next-JS-13.5/assets/77588716/852d43d4-6605-4df9-b826-2db1244f1d6d)

> This project get from [Josh tried coding](https://www.youtube.com/@joshtriedcoding) YouTube channel

> Project Link [Build a Complete SaaS Platform with Next.js 13, React, Prisma, tRPC, Tailwind | Full Course 2023](https://youtu.be/ucX2zXAZ1I0?si=I_OUkHO6cwixcq1a)

## Lucide

- [Lucide](https://lucide.dev/) is an icon library used for shadcn/ui.

## shadcn/ui

- [shadcn](https://ui.shadcn.com/) is designed components that you can copy and paste into your apps.
- you can also install components using `npx` command.

## Kinde

- [Kinde](https://kinde.com/) is a platform used for login and signup
- Just create an account choose the platform that you use for this project and install the dependence `npm i @kinde-oss/kinde-auth-nextjs`
- copy the env past it your env file
- create end API endpoint on `src/app/api/auth/[kindeAuth]/route.js`

```typescript
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request, { params }) {
  const endpoint = params.kindeAuth;
  return handleAuth(request, endpoint);
}
```

- Add a button like the one below it will handle other things.

```typescript
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/server";

<LoginLink>Sign in</LoginLink>

<RegisterLink>Sign up</RegisterLink>


```

- Here, we didn't have a `/sign-in` and `/sign-up` path instead of using the kinde API path so we defined this in a config file for redirect for developer friendly.

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/api/auth/login",
        permanent: true,
      },
      {
        source: "/sign-up",
        destination: "/api/auth/register",
        permanent: true,
      },
    ];
  },
```

## TRPC

- [TRPC](https://trpc.io/docs/client/nextjs/setup) helps you add type-safe for the frontend and backend.
- when you setup you install some dependencies `npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod`
- Create a provider file and add it to `layout.tsx`

```typescript
"use client";
import React, { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { httpBatchLink } from "@trpc/client";

const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "http://localhost:3000/api/trpc" })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};

export default Providers;
```

- create a folder called trpc and add configuration.

- trpc gives protected API using middleware below is an example of adding it

```typescript
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";

const t = initTRPC.create();
const middleware = t.middleware;

// This middle is used for query data for authenticated user
const isAuth = middleware(async (opts) => {
  const { getUser } = getKindeServerSession();

  const user = getUser();
  if (!user || !user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      userId: user.id,
      user,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth);
```

- below you can use public queries and protected queries.

```typescript
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user.id || !user.email) throw new TRPCError({ code: "UNAUTHORIZED" });

    // check if the user is in the database
    const dbUser = await db.user.findFirst({ where: { id: user.id } });

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { success: true };
  }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
});

export type AppRouter = typeof appRouter;
```

- every query and mutation added to separate file maintainable code

> [!IMPORTANT]
> Please check the version of trpc on the documentation.

- the mutation has some properties called onsucess,onerror etc these are very useful when controlling the page functionality.

```typescript
const { mutate: deleteFile } = trpc.deleteFile.useMutation({
  // This will run onsucess
  onSuccess: () => {
    utils.getUserFiles.invalidate();
  },
  // this will run when run the query
  onMutate: ({ id }) => {
    setCurrentlyDeletingFile(id);
  },
  // success or fail this will run after the completion
  onSettled: () => {
    setCurrentlyDeletingFile(null);
  },
});
```

- The cool thing about trpc mutation it has some properties like `retry` and `retryDelay` This is a very helpful thing if you want to run your mutation or query until get success.

```typescript
const { mutate: startPolling } = trpc.getFile.useMutation({
  onSuccess: (file) => {
    router.push(`/dashboard/${file.id}`);
  },
  //NOTE: This is a good one for trpc if we want to rerun this API get success
  retry: true,
  retryDelay: 500,
});
```

## Prisma

- initial setup for prisma using `npx prisma init` This will create a basic setup for your project.

  - create a Prisma folder
  - add database URL to env.

- here I used [neon.tech](https://neon.tech/) for Database.

- Then add the database model to `schema.prisma` file, then run `npx prisma db push` command to sync your database and run `npx prisma generate` to add type data.

- Create a folder called db and add the Prisma db client.

```typescript
import { PrismaClient } from "@prisma/client";
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}
let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
```

## React Drop Zone

-[react drop zone](https://react-dropzone.js.org/) is a library used for file drop in easy to like below one.

```typescript
const UploadDropzone = () => {
  const [isUploading, setIsUploading] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const startSimulatedProgress = () => {
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(interval);
        }
        return prevProgress + 5;
      });
    }, 500);

    return interval;
  };

  return (
    <Dropzone
      multiple={false}
      onDrop={async (acceptedFile) => {
        console.log("acceptfile");
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        // handle file uploading
        await new Promise((rs) => setTimeout(rs, 30000));

        clearInterval(progressInterval);
        setUploadProgress(100);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="border h-64 m-4 border-dashed border-gray-300 rounded-lg"
        >
          <div className="flex items-center justify-center h-full w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                <p className="mb-2 text-sm text-zinc-700">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-zinc-500">PDF (up to 4MB)</p>
              </div>
              {acceptedFiles && acceptedFiles[0] ? (
                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                  <div className="px-3 py-2 h-full grid place-items-center">
                    <File className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="px-3 py-2 h-full text-sm truncate">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="w-full mt-4 max-w-xs mx-auto">
                  <Progress
                    value={uploadProgress}
                    className="h-1 w-full bg-zinc-200"
                  />
                </div>
              ) : null}
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};
```

## React Pdf

- [react pdf](https://react-pdf.org/) is a great package showing pdf files.
- also read this npm package [link]() because if this package wants some configuration in `next.config.js` for the run and also you want to import some CSS files like the below one,

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, thiswebpack }
  ) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
```

```typescript
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
```

## React Resize Detector

- [react-resize-detector](https://www.npmjs.com/package/react-resize-detector) helps for width automatically increase or decrease in the pdf viewport check it in the code for better understanding.

## React SimpleBar

-[react-simplebar](https://www.npmjs.com/package/simplebar-react) is a package used to control the size of the pdf container
-If you want to use this you must import CSS to layout.

```typescript
import "simplebar-react/dist/simplebar.min.css";
```

## UploadThing

- [UploadThing](https://uploadthing.com/) is the easiest way to add file uploads to your full-stack TypeScript application
- This is also similar to S3 but it takes a low amount of time setup.

## React Hook Form

- [React hook form](https://react-hook-form.com/) is used for handling form values and errors.
- If you want to add validation with Zod or another package like yup you should install `yarn add @hookform/resolvers` with this package.

## React Textarea Auto Resize

- [react textarea resize](https://www.npmjs.com/package/react-textarea-autosize) is used for auto resize the textarea input here we used this one to `shadcn` textarea file.

## Pinecone

- [pinecone](https://www.pinecone.io/) is a Long-Term Memory for AI, this is a vector database.
- A vector database is a type of database that indexes and stores vector embeddings for fast retrieval and similarity search, with capabilities like CRUD operations, metadata filtering, and horizontal scaling.

- when you create a Pinecone account you get an API key for Pinecone database access.

- you just create an instance for pinecone like below in enough for use it.

```typescript
import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: "gcp-starter",
});
```

## LangChain

- [langchain](https://www.langchain.com/) is a framework for developing applications powered by language models.

- also, you want to install one dependency with langchain `pnpm install pdf-parse`.

- this is a code you use PDF Loader and OpenAIEmbeddings from langchain,

```typescript
const response = await fetch(
  `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
);

const blob = await response.blob();
const loader = new PDFLoader(blob);

const pageLevelDocs = await loader.load();
const pagesAmt = pageLevelDocs.length;

// vectorized and indexed the entire document
const pineconeIndex = pinecone.Index("quillpdfchatyt");

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPEN_AI_KEY,
});

// NOTE: the namespace properties are not supported for free tier
await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
  pineconeIndex,
  // namespace: createdFile.id,
});
```

- after asking a question we want to find a page for an answer,(this is in the API folder)

```typescript
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPEN_AI_KEY,
});

const pineconeIndex = pinecone.Index("quillpdfchatyt");

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
});

const results = await vectorStore.similaritySearch(message, 4);
```

- after that, you get vector data for that page we want to answer the question using ai so we pass our previous messages and vector for that page to `openai` to answer the following question. so for this purpose, we want to install some packages `pnpm install openai` for chatting with ai and `pnpm install ai` for streaming the chat.

```typescript
const results = await vectorStore.similaritySearch(message, 4);

const prevMessage = await db.message.findMany({
  where: {
    fileId,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 6,
});

const formattedPrevMessages = prevMessage.map((msg) => ({
  role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
  content: msg.text,
}));

const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  temperature: 0,
  stream: true,
  messages: [
    {
      role: "system",
      content:
        "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
    },
    {
      role: "user",
      content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
          
    \n----------------\n
    
    PREVIOUS CONVERSATION:
    ${formattedPrevMessages.map((message) => {
      if (message.role === "user") return `User: ${message.content}\n`;
      return `Assistant: ${message.content}\n`;
    })}
    
    \n----------------\n
    
    CONTEXT:
    ${results.map((r) => r.pageContent).join("\n\n")}
    
    USER INPUT: ${message}`,
    },
  ],
});

const stream = OpenAIStream(response, {
  onCompletion: async (completion) => {
    await db.message.create({
      data: {
        text: completion,
        isUserMessage: false,
        fileId,
        userId,
      },
    });
  },
});

return new StreamingTextResponse(stream);
```

## Mantine Hook

- [Mantine](https://mantine.dev/) is used to create infinity-scrolling intersections.
- Create like the one below,

```typescript
const lastMessageRef = useRef<HTMLDivElement>(null);

const { ref, entry } = useIntersection({
  root: lastMessageRef.current,
  threshold: 1,
});

useEffect(() => {
  if (entry?.isIntersecting) {
    fetchNextPage();
  }
}, [entry, fetchNextPage]);
```

- it will fetch the previous message when you scroll above.

## Stripe

- install the stripe package to use this feature and create a stripe account.
- create a new product name called a pro plan for a subscription.
- Get the price ID from the stripe dashboard and create a checkout flow.

```typescript

  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const billingurl = absoluteUrl("/dashboard/billing");

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingurl,
      });

      return { url: stripeSession.url };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingurl,
      cancel_url: billingurl,
      payment_method_types: ["card", "paypal"],
      mode: "subscription",
      billing_address_collection: "auto",

      line_items: [
        {
          price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),


```

## Seo

- you can create metadata for SEO like below,

```typescript
export function constructMetadata({
  title = "Quill- the saas for students",
  description = "Quill is an open-source software to make chattting to your PDF files easy.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      //Put your Twitter name it shows when someone shares it on Twitter
      creator: "",
    },
    icons,
    metadataBase: new URL(process.env.DEPLOY_BASE_URL!),
    themeColor: "#FFF",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
```

## CSS

- grow - Use grow to allow a flex item to grow to fill any available space.
- flex-[0.75] - This dynamic value like flex-1
- place-items-center - to place grid items in the center of their grid areas on both axes.

> Thanks for [Josh tried coding](https://www.youtube.com/@joshtriedcoding).
