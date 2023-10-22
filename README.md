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
- when you setup you install some dependencies ```npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod``` 
- Create provider file add it to ```layout.tsx```

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

> [!IMPORTANT] 
> please check the version of trpc on documentation.


## Prisma 

- intial setup for prisma using `npx prisma init` this will create a basic setup it your project
  - create prisma folder
  - add database url to env




> Thanks for [Josh tried coding](https://www.youtube.com/@joshtriedcoding).
