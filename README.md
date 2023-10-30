# Quill Pdf Reader AI in Next.js 13.5.3

> This project get from [Josh tried coding](https://www.youtube.com/@joshtriedcoding) YouTube channel

> Project Link [Build a Complete SaaS Platform with Next.js 13, React, Prisma, tRPC, Tailwind | Full Course 2023](https://youtu.be/ucX2zXAZ1I0?si=I_OUkHO6cwixcq1a)

## Lucide

- [Lucide](https://lucide.dev/) is an icon library used for shadcn/ui.

## shadcn/ui

- [shadcn](https://ui.shadcn.com/) is designed components that you can copy and paste into your apps.
- you can also install components using `npx` command.

## Kinde

- [Kinde](https://kinde.com/) is a platform use for login and signup
- Just create a account and choose the platform that you use for this project and install the dependence `npm i @kinde-oss/kinde-auth-nextjs`
- copy the env past it your env file
- create end api end point on `src/app/api/auth/[kindeAuth]/route.js`

```typescript
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request, { params }) {
  const endpoint = params.kindeAuth;
  return handleAuth(request, endpoint);
}
```

- Just add a button like below it will handle other things.

```typescript
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/server";

<LoginLink>Sign in</LoginLink>

<RegisterLink>Sign up</RegisterLink>


```

## TRPC

- [TRPC](https://trpc.io/docs/client/nextjs/setup) is help you add type safe for front and backend.
- when you setup you install some dependencies `npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod`
- Create provider file add it to `layout.tsx`

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

- create folder call trpc and add configuration.

- trpc qive protected api using middleware the below is example for add it

```typescript
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";

const t = initTRPC.create();
const middleware = t.middleware;

// This middle used for query data for authenticated user
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

- below like you can use public queires and protected queires

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

- every queries and mutation added to separt file maintainable code

> [!IMPORTANT]
> please check the version of trpc on documentation.

- the mutation have some properties called onsucess,onerror and etc these are very use full when control the page functionality.

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

- Cool thing about trpc mutation it have some properties like `retry` and `retryDelay` this is very help full thing if you want run your mutation or query until get success.

```typescript
const { mutate: startPolling } = trpc.getFile.useMutation({
  onSuccess: (file) => {
    router.push(`/dashboard/${file.id}`);
  },
  //NOTE:This is a good one for trpc if we want until rerun this api get success
  retry: true,
  retryDelay: 500,
});
```

## Prisma

- initial setup for prisma using `npx prisma init` this will create a basic setup it your project

  - create prisma folder
  - add database url to env

- In here i used [neon.tech](https://neon.tech/) for Database

- Then add database model to `schema.prisma` file,then run `npx prisma db push` command for sync your database and run `npx prisma generate` for add type data.

- Create a folder call db and add prisma db client.

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

-[react drop zone](https://react-dropzone.js.org/) is library use for file drop in easy to like below one.

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

- [react pdf](https://react-pdf.org/) is great package show pdf file.
- also read this npm package [link]() because if this package is want some configuration in `next.config.js` for run and also you want to import some css file like below one,

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

- [react-resize-detector](https://www.npmjs.com/package/react-resize-detector) is helps for width automatically increase or decrease in pdf view port check it in the code for better understanding.

## React SimpleBar

-[react-simplebar](https://www.npmjs.com/package/simplebar-react) is package use for control the size of pdf container
-If you want to use this you must import css to layout.

```typescript
import "simplebar-react/dist/simplebar.min.css";
```

## UploadThing

- [UploadThing](https://uploadthing.com/) is the easiest way to add file uploads to your full-stack TypeScript application
- This is also similar to S3 but it takes a low amount of time setup.

## React Hook Form

- [React hook form](https://react-hook-form.com/) is used for handling form values and errors.
- If you want to add validation with Zod or another package like yup you should install `yarn add @hookform/resolvers` with this package.

## css

- grow - Use grow to allow a flex item to grow to fill any available space.
- flex-[0.75] - this dynamic value like flex-1
- place-items-center - to place grid items on the center of their grid areas on both axes.

> Thanks for [Josh tried coding](https://www.youtube.com/@joshtriedcoding).
